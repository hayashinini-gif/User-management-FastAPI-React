# User Management Console

A full-stack user management system: token-based authentication, role-based
access control, an admin dashboard with live statistics, soft-delete with
restore, and natural-language filtering of the user list.

**Backend** — FastAPI · SQLAlchemy · PostgreSQL · JWT · bcrypt
**Frontend** — React 19 · TypeScript · Vite · Tailwind CSS v4
**AI** — Groq (OpenAI-compatible API), used only to interpret filter requests

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
- Filter that list by typing a request in plain English
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

A Groq API key is needed for the natural-language filters. The free tier is
enough; the rest of the application runs without one, but the app will not
start unless the key is present in `.env`.

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

Open `.env` and fill in every value:

```ini
DATABASE_URL=postgresql://fastapi_user:choose-a-password@localhost:5432/fastapi_auth
SECRET_KEY=<paste a long random string here>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

GROQ_API_KEY=<from console.groq.com>
AI_MODEL=openai/gpt-oss-20b
AI_TIMEOUT_SECONDS=8
```

Generate a `SECRET_KEY` with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

`.env` and `Settings` in `app/core/config.py` must list the same keys. An extra
key in one and not the other stops the app at startup rather than failing
quietly later — that is deliberate, but it does mean adding a setting is a
two-file change.

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
| `POST` | `/api/users/interpret-filters` | Turn a plain-English request into filter parameters |
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

## Natural-language filters

An admin can describe what they want above the Users table instead of setting
four controls by hand:

> admins named Ahmad, newest first

A language model converts that sentence into parameters `GET /api/users`
already accepts. The existing filter controls then populate themselves and the
table reloads as normal.

```
"admins named Ahmad, newest first"
          ↓
POST /api/users/interpret-filters        interpret, then validate
          ↓
{ search: "Ahmad", type: "admin", sort_by: "created_at", sort_order: "desc" }
          ↓
GET /api/users?…                         the existing endpoint, unchanged
          ↓
PostgreSQL
```

**The AI never reaches the database.** It does not generate SQL, does not read
user records, and does not modify anything. It translates English into filter
parameters; the application decides whether those are legal; the existing
endpoint does the querying. `interpret_filters` takes no database session, so
this is a property of the code rather than a rule someone has to remember.

The same is true of what the model is *sent*: a fixed prompt describing the
supported filters, plus the admin's sentence. No user records, no rows, no
conversation history. Interpreting a request needs none of that.

### The contract

The model is told about exactly these fields, and its reply is validated
against them before anything acts on it.

| Field | Accepted values |
|---|---|
| `search` | Any text, up to 100 characters |
| `type` | `admin`, `client` |
| `status` | `active`, `deactivated`, `all` |
| `sort_by` | `id`, `first_name`, `last_name`, `email`, `city`, `age`, `type`, `created_at`, `updated_at` |
| `sort_order` | `asc`, `desc` |
| `unsupported` | A list naming anything the request asked for that this API cannot do |

Anything else is rejected. A field the model invents — `city`, say — is
discarded before application code sees it. An illegal value such as
`type: "superadmin"` fails validation and the whole response is refused, never
partially applied. This is also why a prompt-injection attempt cannot succeed:
`superadmin` is not a value that exists in the schema, so it does not matter
whether the model was persuaded to return it.

Because the parameter surface is fixed, the model cannot offer filters the API
does not have. Asking for *users from Beirut* changes nothing and reports
`unsupported: ["filtering by city"]` — note that `city` can be **sorted** on
but not **filtered** on.

The interpretation is shown to the admin underneath the input
(*Interpreted as Search "Ahmad" · Role: Admins · Sort: Created ↓*). A language
model is not deterministic and will occasionally misread a request; showing
what it understood turns that from a page that looks broken into an obvious,
one-click fix.

### What happens when it fails

| Failure | Status | What the admin sees |
|---|---|---|
| Query empty or over 200 characters | `422` | Rejected before any API call, so it costs nothing |
| More than 10 requests a minute, or 200 a day | `429` | "Too many requests in a row." |
| Model output fails validation | `422` | "I couldn't turn that into filters." |
| Timeout, outage or bad key | `503` | "The AI is unavailable — the filters below still work." |

In every one of those cases the search box, role and status selects, column
sorting and pagination keep working, because none of them were ever routed
through the AI. Remove the feature entirely and the page behaves exactly as it
did before it existed.

### Cost

Roughly 350 tokens in and 80 out per request. The input is capped at 200
characters, `max_tokens` at 300, and there is no conversation history, so every
call costs about the same. Rate limiting bounds the worst case per admin, and
the input only submits on Enter — unlike the search box below it, which is
debounced per keystroke because searching is free and inference is not.

### Changing provider

Every vendor-specific line lives in `_call_model()` in
`app/services/ai_filters.py`. The rest of the feature — the schema, the rate
limiter, the endpoint, the frontend — works on validated results rather than on
any vendor's response format. This was built against Anthropic first and moved
to Groq later; one file changed, and the only tests that needed rewriting were
the ones that knew what a vendor response looked like. They now mock
`_call_model` instead.

---

## Running the tests

```bash
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
pytest -v
```

The suite covers the rules that matter if they break: that registration cannot
grant itself a role, that a client cannot reach admin endpoints, that an admin
cannot lock themselves out, that a deactivated user cannot authenticate, that
partial profile updates do not wipe other fields, that the sort column is
whitelisted, and that no response ever contains a password hash.

For the AI feature it covers the two trust boundaries: that oversized or empty
input is rejected before a request is made, that illegal filter values are
refused, that invented fields are dropped, and that a provider outage surfaces
as a handled error rather than a crash.

**No test calls the language model.** Model output is non-deterministic, so
such a test would be flaky by construction, would cost money on every run, and
would be testing the provider rather than this code. The provider is mocked;
interpretation quality is checked by hand against a short list of phrasings
(see `docs/`).

The tests run against a throwaway SQLite file (`test_users.db`, git-ignored)
and never touch your PostgreSQL database, so they are safe to run at any time.

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
    │   ├── dependencies.py   # get_current_user, get_current_admin_user
    │   └── rate_limit.py     # per-admin sliding window for AI requests
    ├── db/
    │   ├── base.py           # declarative Base
    │   └── session.py        # engine, SessionLocal, get_db
    ├── models/user.py    # the users table
    ├── schemas/          # Pydantic request/response shapes
    │   └── filters.py        # the two AI trust boundaries
    ├── services/
    │   └── ai_filters.py     # prompt, provider call, parsing
    └── api/routes/       # auth · users · admin · stats · filters

frontend/
└── src/
    ├── components/ui/    # Button, Input, Modal, DataTable, …
    ├── components/layout/# Sidebar, Topbar, AppLayout
    ├── components/users/ # UserFormModal, NaturalLanguageFilter, …
    ├── context/          # AuthContext, ToastContext
    ├── pages/            # Login, Register, Dashboard, Users, Roles, …
    ├── services/api.ts   # axios client and endpoint wrappers
    └── index.css         # design tokens

docs/                     # architecture notes and revision material
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
- The **AI API key never reaches the browser.** The interpretation call is made
  server-side; the browser only ever talks to this API. Every request the page
  makes is visible in the network tab, and none of them go to the provider.
- **Model output is treated as untrusted input**, exactly like a request body:
  parsed, validated against a whitelist, and refused if illegal.
- The AI endpoint sits behind the same `get_current_admin_user` dependency as
  every other admin route, so it grants no access a button click would not.
- Provider errors are logged server-side and never returned to the browser — an
  expired key or a billing problem must not be visible to users.

## Known limitations

- No refresh tokens — the 30-minute access token simply expires.
- A token cannot be revoked before it expires; sign-out clears it client-side.
- No login rate limiting.
- No password reset or email verification.
- Schema changes rely on `create_all`, which only creates missing tables. Adding
  a column to an existing table needs a migration tool such as Alembic.
- Natural-language filtering can only express filters the API already has:
  no filtering by city, age or date range, no compound logic such as
  "admins or clients in Beirut", and no negation.
- Only one search term at a time — `search` is a single string matched against
  three columns.
- Interpretation is non-deterministic; the same sentence may occasionally
  produce different parameters. The visible interpretation and the manual
  controls are the mitigation.
- The AI rate limiter is held in memory, so it resets when the process
  restarts and does not hold across multiple workers. Moving the counter to
  Redis would fix both.
- Interpretation has not been tested with Arabic or mixed-script input.
