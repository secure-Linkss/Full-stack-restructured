# Brain Link Tracker — Claude Code Context

## Project Overview
Full-stack SaaS link tracking platform at this directory.
- **Stack:** React 18 + Vite | Flask 3 | PostgreSQL/Neon | Vercel (serverless)
- **Live URL:** https://brain-link-tracker-v2.vercel.app
- **Git branch:** `master` — Vercel auto-deploys from this branch
- **Detailed Obsidian notes:** `/Users/rasheedsalau/Obsidian/02-Projects/Brain-Link-Tracker/`

## CRITICAL RULES — NEVER VIOLATE

### 1. Quantum Redirect Engine — DO NOT TOUCH
Never modify these files without explicit instruction from Rasheed:
- `api/routes/quantum_redirect.py`
- `api/routes/track.py`
- `api/routes/bridge.py`
- `vercel.json` routes for `/q/`, `/t/`, `/p/`, `/h/`, `/bridge`, `/validate`, `/route`

These are the revenue-generating core of the platform. Breaking them breaks all tracking.

### 2. Auth Pattern — ALWAYS use canonical decorator
```python
# ✅ CORRECT — use this in ALL new backend routes
from api.middleware.auth_decorators import login_required
from flask import g

@bp.route('/api/something', methods=['GET'])
@login_required
def handler():
    user = g.user  # set by login_required
    ...

# ❌ WRONG — never use local session-based decorators
def login_required(f):
    def wrapper(*args, **kwargs):
        if "user_id" not in session:  # session is always empty with JWT auth
            return jsonify({"error": "unauthorized"}), 401
```

### 3. DataTable cell functions — NEVER use React Table destructuring
```jsx
// ✅ CORRECT — DataTable passes row data directly
cell: (row) => <span>{row.fieldName}</span>

// ❌ WRONG — DataTable does NOT use { row } / row.original pattern
cell: ({ row }) => <span>{row.original.fieldName}</span>  // CRASHES
```

### 4. Blueprint registration prefix
When registering a blueprint with `None` prefix in `api/index.py`, routes must include the full path:
```python
# Blueprint registered with None prefix → routes need full /api/ path
@bp.route('/api/settings', methods=['GET'])   # ✅
@bp.route('/settings', methods=['GET'])        # ❌ only accessible at /settings, not /api/settings
```

### 5. pnpm lockfile — always sync after npm changes
```bash
npm install some-package  # updates package.json
pnpm install              # MUST run this to sync pnpm-lock.yaml
```

### 6. Never add Footer inside page components
`Layout.jsx` already renders `<Footer isPublic={false} />`. Do NOT add Footer inside Dashboard, AdminPanel, or any other page component that uses Layout — it creates a double footer.

## Key Architecture

### Quantum Redirect Flow (4-stage, NEVER break)
```
Click → /t/<code> → /validate?token=... → /route?token=... → /bridge → destination
```
Each stage validates the quantum token. Every redirect is logged.

### Authentication
- JWT stored in `localStorage` under key `"token"`
- Backend reads: `Authorization: Bearer <token>` header
- `g.user` is set after `@login_required` runs
- Roles: `main_admin`, `admin`, `user`

### Database (Neon PostgreSQL)
- Connection string in `DATABASE_URL` env var
- SQLAlchemy ORM via `api/database.py`
- `Link` table has: `total_clicks`, `click_count`, `real_visitors`, `blocked_attempts` — these are the authoritative click counters
- `TrackingEvent` table is sparse — do NOT use it as primary click counter

### Frontend API Calls
All API calls go through `src/services/api.js`:
- Uses relative `/api` base URL (Vercel proxies to Flask)
- Always sends `Authorization: Bearer <token>` header
- Handles 401 → redirect to /login automatically

## Test Accounts
| Account | Password | Role | Plan |
|---------|----------|------|------|
| Brain | Mayflower1!! | main_admin | enterprise |
| 7thbrain | Mayflower1! | admin | — |
| enterprise_test | Enterprise2024! | user | enterprise |
| pro_test | Pro2024! | user | pro |

## Common Bugs Fixed (reference before making changes)
See `/Users/rasheedsalau/Obsidian/02-Projects/Brain-Link-Tracker/Bug-Tracker.md`

- BUG-036: LinkShortener DataTable crash — `cell: ({ row })` pattern is wrong
- BUG-037: AdminPanel double footer — Layout already has Footer
- BUG-038: settings.py routes at wrong path `/user` instead of `/api/settings`
- BUG-001: api.js fallback was `http://localhost:5000/api` — must be `/api`

## Deployment
```bash
cd Full-stack-restructured
npm run build           # rebuild dist/
git add api/ src/ dist/
git commit -m "your message"
git push origin master  # Vercel auto-deploys
```
