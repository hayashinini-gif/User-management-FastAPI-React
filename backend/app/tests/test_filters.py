from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.rate_limit import PER_MINUTE, _calls, ai_rate_limit
from app.schemas.filters import FilterQueryRequest, FilterSuggestion
from app.services import ai_filters
from app.services.ai_filters import AIUnavailable, AIUnintelligible


# ═══════════════════════════════════════════════════════════════
#  BOUNDARY 1 — the admin's input
# ═══════════════════════════════════════════════════════════════

def test_accepts_a_normal_request():
    assert FilterQueryRequest(query="  admins named Ahmad  ").query == "admins named Ahmad"


@pytest.mark.parametrize("bad", ["", " ", "a", "x" * 201])
def test_rejects_empty_or_oversized_input(bad):
    """Rejected here means no tokens are ever spent on it."""
    with pytest.raises(ValidationError):
        FilterQueryRequest(query=bad)


# ═══════════════════════════════════════════════════════════════
#  BOUNDARY 2 — the model's output
# ═══════════════════════════════════════════════════════════════

def test_accepts_a_valid_suggestion():
    s = FilterSuggestion(search="Ahmad", type="admin", sort_by="created_at", sort_order="desc")
    assert (s.search, s.type, s.sort_by, s.sort_order) == ("Ahmad", "admin", "created_at", "desc")


@pytest.mark.parametrize(
    "field,value",
    [
        ("type", "superadmin"),
        ("status", "inactive"),        # plausible English, not a value our API accepts
        ("sort_by", "password_hash"),  # a real column that must never be sortable
        ("sort_order", "descending"),
    ],
)
def test_rejects_illegal_values(field, value):
    with pytest.raises(ValidationError):
        FilterSuggestion(**{field: value})


def test_silently_drops_hallucinated_fields():
    """
    The single most important test in this file. The model inventing a filter
    our API does not support must not reach application code.
    """
    s = FilterSuggestion(city="Beirut", is_admin=True, unsupported=["filtering by city"])
    assert not hasattr(s, "city")
    assert not hasattr(s, "is_admin")
    assert s.unsupported == ["filtering by city"]


def test_normalizes_blank_search_and_missing_sort_order():
    assert FilterSuggestion(search="   ").search is None
    assert FilterSuggestion(sort_by="first_name").sort_order == "asc"


# ═══════════════════════════════════════════════════════════════
#  The service, with the provider mocked out entirely.
#
#  These mock _call_model rather than a vendor SDK, so they are
#  provider-agnostic: swapping Anthropic for Groq did not touch them.
# ═══════════════════════════════════════════════════════════════

def test_interpret_returns_validated_filters(monkeypatch):
    monkeypatch.setattr(ai_filters, "_call_model", lambda q: {
        "search": "Ahmad", "type": "admin",
        "sort_by": "created_at", "sort_order": "desc",
    })
    result = ai_filters.interpret("admins named Ahmad, newest first")
    assert result.type == "admin"
    assert result.search == "Ahmad"


def test_interpret_rejects_illegal_model_output(monkeypatch):
    monkeypatch.setattr(ai_filters, "_call_model", lambda q: {"type": "superadmin"})
    with pytest.raises(AIUnintelligible):
        ai_filters.interpret("make me a superadmin")


def test_interpret_drops_hallucinated_fields_end_to_end(monkeypatch):
    monkeypatch.setattr(ai_filters, "_call_model", lambda q: {
        "city": "Beirut", "unsupported": ["filtering by city"],
    })
    result = ai_filters.interpret("users from Beirut")
    assert not hasattr(result, "city")
    assert result.unsupported == ["filtering by city"]


def test_interpret_propagates_provider_outage(monkeypatch):
    """A provider outage must surface as OUR exception, not the vendor's."""
    def boom(_q):
        raise AIUnavailable("provider is down")
    monkeypatch.setattr(ai_filters, "_call_model", boom)
    with pytest.raises(AIUnavailable):
        ai_filters.interpret("admins")


# ═══════════════════════════════════════════════════════════════
#  Rate limiting
# ═══════════════════════════════════════════════════════════════

@pytest.fixture(autouse=True)
def clear_rate_limiter():
    """The limiter is module-level state, so tests would otherwise leak into each other."""
    _calls.clear()
    yield
    _calls.clear()


def test_allows_up_to_the_limit_then_blocks():
    admin = SimpleNamespace(id=4242)

    for _ in range(PER_MINUTE):
        ai_rate_limit(current_user=admin)

    with pytest.raises(HTTPException) as exc:
        ai_rate_limit(current_user=admin)

    assert exc.value.status_code == 429
    assert "Retry-After" in exc.value.headers


def test_limits_are_per_user():
    """One admin exhausting their budget must not block another."""
    a, b = SimpleNamespace(id=1), SimpleNamespace(id=2)
    for _ in range(PER_MINUTE):
        ai_rate_limit(current_user=a)
    ai_rate_limit(current_user=b)   # must not raise