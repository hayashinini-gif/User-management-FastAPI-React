# User Management Console

A full-stack user management system: token-based authentication, role-based
access control, an admin dashboard with live statistics, and soft-delete with
restore.

**Backend** — FastAPI · SQLAlchemy · PostgreSQL · JWT · bcrypt
**Frontend** — React 19 · TypeScript · Vite · Tailwind CSS v4

```
React (Vite, :5173)  ──HTTP + JWT──►  FastAPI (uvicorn, :8001)  ──SQLAlchemy──►  PostgreSQL
```

---

## What it does

**Anyone**
- Register an account and sign in
- Receive a JWT valid for 30 minutes

**Signed-in users**
- View and edit their own profile
- Change their password (re-entering the current one)
- See public statistics about the user base

**Administrators**
- List every account with server-side search, filtering, sorting and pagination
- Create, edit and view any account
- Promote and demote between `admin` and `client`
- Deactivate and reactivate accounts (soft delete — nothing is erased)
- A dashboard of totals, role split and top cities

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11 or newer |
| Node.js | 20 or newer |
| PostgreSQL | 14 or newer |

---

## Setup

### 1. Database

Create the database and a user for it:

```sql
CREATE DATABASE fastapi_auth;
CREATE USER fastapi_user WITH PASSWORD 'choose-a-password';
GRANT ALL PRIVILEGES ON DATABASE fastapi_auth TO fastapi_user;
```

### 2. Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # Windows: copy .env.example .env
```

Open `.env` and fill in all four values:

```ini
DATABASE_URL=postgresql://fastapi_user:choose-a-password@localhost:5432/fastapi_auth
SECRET_KEY=<paste a long random string here>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate a `SECRET_KEY` with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8001
```

The tables are created automatically on first start. Interactive API docs are
at **http://localhost:8001/docs**.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Creating the first administrator

**Read this before you try to use the admin pages.**

Public registration always creates a `client`. This is deliberate — if the
sign-up form accepted a role, anyone on the internet could register themselves
as an administrator. Promotion is an admin-only action, which leaves a
chicken-and-egg problem on a brand-new database: there is no admin to do the
promoting.

So the first admin is promoted directly in the database, once:

```bash
psql -U fastapi_user -d fastapi_auth
```

```sql
UPDATE users SET type = 'admin' WHERE email = 'your@email.com';
```

Sign out and back in to pick up the new role. Every later admin can be
promoted from the **Roles & Permissions** page.

---

## API reference

Base URL: `http://localhost:8001`

### Authentication — public

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account (always a `client`) |
| `POST` | `/api/auth/login` | Exchange credentials for a JWT |

### Own account — any signed-in user

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/users/me` | Read your profile |
| `PUT` | `/api/users/me` | Update your name, phone, city, age |
| `POST` | `/api/users/me/change-password` | Change password |
| `GET` | `/api/users/{id}` | Read a single user |
| `GET` | `/api/stats/user-count` | Total active accounts |
| `GET` | `/api/stats/average-age` | Average age |
| `GET` | `/api/stats/top-cities` | Five cities with the most users |
| `GET` | `/api/stats/user-distribution` | Count per role |

### Administration — admin only

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/users` | List users (search, filter, sort, paginate) |
| `PUT` | `/api/users/{id}/role` | Change a role |
| `DELETE` | `/api/users/{id}` | Deactivate (soft delete) |
| `POST` | `/api/users/{id}/restore` | Reactivate |
| `PUT` | `/api/admin/users/{id}` | Edit any field on any account |
| `POST` | `/api/admin/users/{id}/promote` | Promote to admin |

### Listing users

`GET /api/users` accepts:

| Parameter | Default | Meaning |
|---|---|---|
| `skip` | `0` | Records to skip |
| `limit` | `10` | Records per page (max 100) |
| `search` | — | Case-insensitive partial match on first name, last name or email |
| `type` | — | Filter by role: `admin` or `client` |
| `sort_by` | `id` | Sort column — must be one of the allowed columns |
| `sort_order` | `asc` | `asc` or `desc` |
| `status` | `active` | `active`, `deactivated` or `all` |

```
GET /api/users?search=ada&type=client&sort_by=created_at&sort_order=desc&limit=10
```

Returns a page plus the total number of matches, so the client can work out how
many pages exist:

```json
{ "items": [ ... ], "total": 34, "skip": 0, "limit": 10 }
```

---

## Running the tests

```bash
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
pytest -v
```

37 tests covering the rules that matter if they break: that registration
cannot grant itself a role, that a client cannot reach admin endpoints, that
an admin cannot lock themselves out, that a deactivated user cannot
authenticate, that partial profile updates do not wipe other fields, that the
sort column is whitelisted, and that no response ever contains a password
hash.

They run against a throwaway SQLite file (`test_users.db`, git-ignored) and
never touch your PostgreSQL database, so they are safe to run at any time.

---

## Project structure

```
backend/
├── .env                  # secrets — git-ignored
├── .env.example          # template
├── requirements.txt
└── app/
    ├── main.py           # app, routers, CORS
    ├── core/
    │   ├── config.py         # settings loaded from .env
    │   ├── security.py       # bcrypt hashing, JWT create/verify
    │   └── dependencies.py   # get_current_user, get_current_admin_user
    ├── db/
    │   ├── base.py           # declarative Base
    │   └── session.py        # engine, SessionLocal, get_db
    ├── models/user.py    # the users table
    ├── schemas/          # Pydantic request/response shapes
    └── api/routes/       # auth · users · admin · stats

frontend/
└── src/
    ├── components/ui/    # Button, Input, Modal, DataTable, …
    ├── components/layout/# Sidebar, Topbar, AppLayout
    ├── context/          # AuthContext, ToastContext
    ├── pages/            # Login, Register, Dashboard, Users, Roles, …
    ├── services/api.ts   # axios client and endpoint wrappers
    └── index.css         # design tokens
```

---

## Security notes

- Passwords are hashed with **bcrypt**; the plaintext is never stored and
  cannot be recovered.
- The JWT is **signed, not encrypted** — its contents are readable by anyone
  holding it, so it carries only the user id and an expiry.
- Route protection in the React app is a convenience, not a security boundary.
  **Every** protected endpoint re-checks authorisation on the server.
- A user cannot change their own role or deactivate their own account, enforced
  in the API rather than only in the UI.
- `password_hash` is absent from every response schema, so it cannot leak.

## Known limitations

- No refresh tokens — the 30-minute access token simply expires.
- A token cannot be revoked before it expires; sign-out clears it client-side.
- No login rate limiting.
- No password reset or email verification.
- Schema changes rely on `create_all`, which only creates missing tables. Adding
  a column to an existing table needs a migration tool such as Alembic.
