"""
Security and authorisation tests.

These run against a throwaway SQLite file, never your PostgreSQL database.
`DATABASE_URL` is set before importing the app because `app/db/session.py`
builds the engine at import time — if the engine were created lazily, this
override could live in a fixture instead.

Run from the `backend/` directory:

    pytest -v
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_users.db"
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-used-anywhere-else")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User

CLIENT_EMAIL = "client@example.com"
ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


@pytest.fixture()
def client():
    """A fresh, empty database for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def register(client, email, first="Test", last="User", **extra):
    body = {
        "first_name": first,
        "last_name": last,
        "email": email,
        "password": PASSWORD,
        **extra,
    }
    return client.post("/api/auth/register", json=body)


def token_for(client, email):
    res = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return res.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def promote_directly(email):
    """Bootstrap an admin the way a real deployment does — in the database."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    user.type = "admin"
    db.commit()
    user_id = user.id
    db.close()
    return user_id


@pytest.fixture()
def admin(client):
    # Deliberately not named "Ada" — the search tests below look for that,
    # and the admin turning up in those results would mask a real failure.
    register(client, ADMIN_EMAIL, first="Root", last="Admin")
    user_id = promote_directly(ADMIN_EMAIL)
    return {"id": user_id, "headers": auth(token_for(client, ADMIN_EMAIL))}


@pytest.fixture()
def normal(client):
    res = register(client, CLIENT_EMAIL, first="Cal", last="Client")
    return {"id": res.json()["id"], "headers": auth(token_for(client, CLIENT_EMAIL))}


# ── Registration ──────────────────────────────────────────────────────────
class TestRegistration:
    def test_creates_a_client(self, client):
        res = register(client, "new@example.com")
        assert res.status_code == 201
        assert res.json()["type"] == "client"

    def test_cannot_choose_its_own_role(self, client):
        """The privilege-escalation guard. Asking for admin must not grant it."""
        res = register(client, "attacker@example.com", type="admin")
        assert res.status_code == 201
        assert res.json()["type"] == "client"

    def test_never_returns_the_password_hash(self, client):
        res = register(client, "hash@example.com")
        assert "password_hash" not in res.text
        assert "password" not in res.json()

    def test_rejects_a_short_password(self, client):
        res = client.post("/api/auth/register", json={
            "first_name": "S", "last_name": "Hort",
            "email": "short@example.com", "password": "abc",
        })
        assert res.status_code == 422

    def test_rejects_an_invalid_email(self, client):
        res = client.post("/api/auth/register", json={
            "first_name": "B", "last_name": "Ad",
            "email": "not-an-email", "password": PASSWORD,
        })
        assert res.status_code == 422

    def test_rejects_a_duplicate_email(self, client):
        register(client, "dup@example.com")
        res = register(client, "dup@example.com")
        assert res.status_code == 400


# ── Login ─────────────────────────────────────────────────────────────────
class TestLogin:
    def test_returns_a_token_and_the_user(self, client):
        register(client, CLIENT_EMAIL)
        res = client.post("/api/auth/login", json={"email": CLIENT_EMAIL, "password": PASSWORD})
        assert res.status_code == 200
        assert res.json()["token_type"] == "bearer"
        assert res.json()["user"]["email"] == CLIENT_EMAIL

    def test_wrong_password_is_rejected(self, client):
        register(client, CLIENT_EMAIL)
        res = client.post("/api/auth/login", json={"email": CLIENT_EMAIL, "password": "wrong-one"})
        assert res.status_code == 401

    def test_unknown_email_gives_the_same_message(self, client):
        """Different messages would let an attacker discover which emails exist."""
        register(client, CLIENT_EMAIL)
        wrong_password = client.post(
            "/api/auth/login", json={"email": CLIENT_EMAIL, "password": "wrong-one"})
        unknown_email = client.post(
            "/api/auth/login", json={"email": "nobody@example.com", "password": PASSWORD})
        assert wrong_password.status_code == unknown_email.status_code == 401
        assert wrong_password.json()["detail"] == unknown_email.json()["detail"]


# ── Authentication ────────────────────────────────────────────────────────
class TestAuthentication:
    def test_me_requires_a_token(self, client):
        assert client.get("/api/users/me").status_code in (401, 403)

    def test_me_rejects_a_forged_token(self, client):
        res = client.get("/api/users/me", headers=auth("not.a.real.token"))
        assert res.status_code == 401

    def test_me_returns_the_signed_in_user(self, client, normal):
        res = client.get("/api/users/me", headers=normal["headers"])
        assert res.status_code == 200
        assert res.json()["email"] == CLIENT_EMAIL

    def test_a_deactivated_user_cannot_authenticate(self, client, admin, normal):
        client.delete(f"/api/users/{normal['id']}", headers=admin["headers"])
        res = client.get("/api/users/me", headers=normal["headers"])
        assert res.status_code == 404


# ── Authorisation ─────────────────────────────────────────────────────────
class TestAuthorisation:
    def test_a_client_cannot_list_users(self, client, normal):
        assert client.get("/api/users", headers=normal["headers"]).status_code == 403

    def test_an_admin_can_list_users(self, client, admin):
        assert client.get("/api/users", headers=admin["headers"]).status_code == 200

    def test_a_client_cannot_change_a_role(self, client, admin, normal):
        res = client.put(f"/api/users/{admin['id']}/role",
                         json={"type": "client"}, headers=normal["headers"])
        assert res.status_code == 403

    def test_a_client_cannot_deactivate_anyone(self, client, admin, normal):
        res = client.delete(f"/api/users/{admin['id']}", headers=normal["headers"])
        assert res.status_code == 403

    def test_statistics_require_a_signed_in_user(self, client, normal):
        for path in ("user-count", "average-age", "top-cities", "user-distribution"):
            assert client.get(f"/api/stats/{path}").status_code in (401, 403)
            assert client.get(f"/api/stats/{path}", headers=normal["headers"]).status_code == 200


# ── Guards against locking yourself out ───────────────────────────────────
class TestSelfProtection:
    def test_an_admin_cannot_change_their_own_role(self, client, admin):
        res = client.put(f"/api/users/{admin['id']}/role",
                         json={"type": "client"}, headers=admin["headers"])
        assert res.status_code == 400

    def test_an_admin_cannot_deactivate_themselves(self, client, admin):
        res = client.delete(f"/api/users/{admin['id']}", headers=admin["headers"])
        assert res.status_code == 400


# ── Editing your own profile ──────────────────────────────────────────────
class TestOwnProfile:
    def test_cannot_promote_yourself_through_the_profile_endpoint(self, client, normal):
        res = client.put("/api/users/me",
                         json={"city": "Beirut", "type": "admin"},
                         headers=normal["headers"])
        assert res.status_code == 200
        assert res.json()["type"] == "client"

    def test_cannot_change_your_email_through_the_profile_endpoint(self, client, normal):
        res = client.put("/api/users/me",
                         json={"email": "somethingelse@example.com"},
                         headers=normal["headers"])
        assert res.json()["email"] == CLIENT_EMAIL

    def test_a_partial_update_leaves_other_fields_alone(self, client, normal):
        client.put("/api/users/me", json={"city": "Beirut", "age": 30},
                   headers=normal["headers"])
        res = client.put("/api/users/me", json={"city": "London"},
                         headers=normal["headers"])
        assert res.json()["city"] == "London"
        assert res.json()["age"] == 30          # not wiped by the second call
        assert res.json()["first_name"] == "Cal"

    def test_changing_password_requires_the_current_one(self, client, normal):
        wrong = client.post("/api/users/me/change-password",
                            json={"current_password": "not-it", "new_password": "brandnew123"},
                            headers=normal["headers"])
        assert wrong.status_code == 401

        right = client.post("/api/users/me/change-password",
                            json={"current_password": PASSWORD, "new_password": "brandnew123"},
                            headers=normal["headers"])
        assert right.status_code == 200
        assert client.post("/api/auth/login",
                           json={"email": CLIENT_EMAIL, "password": "brandnew123"}).status_code == 200


# ── Admin editing other accounts ──────────────────────────────────────────
class TestAdminUpdate:
    def test_rejects_a_role_outside_the_allowed_set(self, client, admin, normal):
        res = client.put(f"/api/admin/users/{normal['id']}",
                         json={"type": "Developer"}, headers=admin["headers"])
        assert res.status_code == 422

    def test_accepts_a_valid_role(self, client, admin, normal):
        res = client.put(f"/api/admin/users/{normal['id']}",
                         json={"type": "admin"}, headers=admin["headers"])
        assert res.status_code == 200
        assert res.json()["type"] == "admin"


# ── Listing: search, filter, sort, paginate ───────────────────────────────
class TestListUsers:
    @pytest.fixture(autouse=True)
    def people(self, client, admin):
        register(client, "ada.lovelace@example.com", first="Ada", last="Lovelace")
        register(client, "grace.hopper@example.com", first="Grace", last="Hopper")
        register(client, "alan.turing@example.com", first="Alan", last="Turing")
        self.headers = admin["headers"]

    def test_returns_a_pagination_envelope(self, client):
        res = client.get("/api/users", headers=self.headers)
        assert res.status_code == 200
        assert set(res.json()) == {"items", "total", "skip", "limit"}

    def test_total_counts_matches_not_just_this_page(self, client):
        res = client.get("/api/users?limit=1", headers=self.headers)
        assert len(res.json()["items"]) == 1
        assert res.json()["total"] == 4          # 3 registered + the admin

    def test_search_is_case_insensitive_and_partial(self, client):
        res = client.get("/api/users?search=ADA", headers=self.headers)
        assert res.json()["total"] == 1
        assert res.json()["items"][0]["first_name"] == "Ada"

    def test_search_also_matches_the_email(self, client):
        res = client.get("/api/users?search=hopper", headers=self.headers)
        assert res.json()["total"] == 1

    def test_filters_by_role(self, client):
        assert client.get("/api/users?type=admin", headers=self.headers).json()["total"] == 1
        assert client.get("/api/users?type=client", headers=self.headers).json()["total"] == 3

    def test_sorts_in_both_directions(self, client):
        asc = client.get("/api/users?sort_by=first_name&sort_order=asc",
                         headers=self.headers).json()["items"]
        desc = client.get("/api/users?sort_by=first_name&sort_order=desc",
                          headers=self.headers).json()["items"]
        names = [u["first_name"] for u in asc]
        assert names == sorted(names)
        assert [u["first_name"] for u in desc] == names[::-1]

    def test_rejects_a_sort_column_that_is_not_whitelisted(self, client):
        """Without the whitelist this parameter would reach SQL directly."""
        res = client.get("/api/users?sort_by=password_hash", headers=self.headers)
        assert res.status_code == 400

    def test_paging_walks_through_without_repeating(self, client):
        first = client.get("/api/users?skip=0&limit=2&sort_by=id",
                           headers=self.headers).json()["items"]
        second = client.get("/api/users?skip=2&limit=2&sort_by=id",
                            headers=self.headers).json()["items"]
        assert {u["id"] for u in first}.isdisjoint({u["id"] for u in second})


# ── Soft delete and restore ───────────────────────────────────────────────
class TestSoftDelete:
    def test_deactivating_hides_the_user_but_keeps_the_row(self, client, admin, normal):
        assert client.delete(f"/api/users/{normal['id']}",
                             headers=admin["headers"]).status_code == 204

        active = client.get("/api/users?status=active", headers=admin["headers"]).json()
        assert normal["id"] not in [u["id"] for u in active["items"]]

        deactivated = client.get("/api/users?status=deactivated",
                                 headers=admin["headers"]).json()
        assert normal["id"] in [u["id"] for u in deactivated["items"]]

    def test_restore_brings_the_user_back(self, client, admin, normal):
        client.delete(f"/api/users/{normal['id']}", headers=admin["headers"])
        res = client.post(f"/api/users/{normal['id']}/restore", headers=admin["headers"])
        assert res.status_code == 200
        assert res.json()["is_deleted"] is False

    def test_restore_is_idempotent(self, client, admin, normal):
        """Calling it on an active account is a no-op, not an error."""
        res = client.post(f"/api/users/{normal['id']}/restore", headers=admin["headers"])
        assert res.status_code == 200
        assert res.json()["is_deleted"] is False
