from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ─────────────────────────────────────────────────────────────
#  BOUNDARY 1 — what the ADMIN sends us.
#  Validated BEFORE we spend a single token on the model.
# ─────────────────────────────────────────────────────────────
class FilterQueryRequest(BaseModel):
    """
    200 characters is far more than "admins named Ahmad, newest first"
    needs, and it caps both the token cost and the size of any prompt
    injection payload. 2 characters minimum rejects a stray Enter.
    """
    query: str = Field(..., min_length=2, max_length=200)

    @field_validator("query")
    @classmethod
    def not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Query must contain at least 2 characters.")
        return cleaned


# ─────────────────────────────────────────────────────────────
#  BOUNDARY 2 — what the MODEL may send us.
#  These values are copied from the real API. Nothing else exists.
# ─────────────────────────────────────────────────────────────
UserType = Literal["admin", "client"]
UserStatus = Literal["active", "deactivated", "all"]
SortBy = Literal[
    "id", "first_name", "last_name", "email",
    "city", "age", "type", "created_at", "updated_at",
]
SortOrder = Literal["asc", "desc"]


class FilterSuggestion(BaseModel):
    """
    The AI's output is untrusted input, exactly like a browser request.

    extra="ignore": a field the model invented (city, is_admin, role...)
    is discarded before application code ever sees it. We do NOT fail the
    whole request over one hallucinated key — the valid filters survive.
    """
    model_config = ConfigDict(extra="ignore")

    search: Optional[str] = Field(None, max_length=100)
    type: Optional[UserType] = None
    status: Optional[UserStatus] = None
    sort_by: Optional[SortBy] = None
    sort_order: Optional[SortOrder] = None

    # Things the admin asked for that this API cannot do, e.g. ["city filtering"].
    # Capped so a rambling model can't fill the UI with text.
    unsupported: List[str] = Field(default_factory=list, max_length=5)

    @field_validator("search")
    @classmethod
    def clean_search(cls, v: Optional[str]) -> Optional[str]:
        """An empty string is not a search term — it's silence. Normalize it."""
        if v is None:
            return None
        return v.strip() or None

    @model_validator(mode="after")
    def default_sort_order(self):
        """
        "sorted by name" names a column but not a direction. Rather than
        leaving the frontend to guess, fill in the sane default here so
        every consumer sees a complete, coherent object.
        """
        if self.sort_by and not self.sort_order:
            self.sort_order = "asc"
        return self