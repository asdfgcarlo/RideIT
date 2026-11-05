# RideIT API

Install `requirements.txt` in a Python virtual environment. Copy `.env.example`
to `.env`, fill in the MySQL settings, and generate `RIDEIT_TOKEN_SECRET` with:

```sh
python -c "import secrets; print(secrets.token_hex(32))"
```

Keep the secret stable across restarts and server workers. Set the same backend
variables in Render's environment; local `.env` files are ignored by Git.
Database credentials must be configured there now; they are no longer embedded
in the application source. Never use an `EXPO_PUBLIC_` variable for a secret.

The backend accepts both variable naming styles. Nonempty `MYSQL_*` values
take precedence when both are present:

| Flask names | Original names |
| --- | --- |
| `MYSQL_HOST` | `DB_HOST` |
| `MYSQL_PORT` | `DB_PORT` |
| `MYSQL_USER` | `DB_USER` |
| `MYSQL_PASSWORD` | `DB_PASSWORD` |
| `MYSQL_DB` | `DB_NAME` |
| `MYSQL_SSL_CA` | `DB_SSL_CA` |

For Aiven, download your project's CA certificate from its connection settings.
Locally, save it as `backend/certs/ca.pem` and set `DB_SSL_CA=certs/ca.pem`.
Relative paths resolve against `backend/` first, then the repository root.
On Render, upload it under **Environment > Secret Files** with filename `ca.pem`
and set `DB_SSL_CA=/etc/secrets/ca.pem`. Existing relative paths also recognize
a mounted secret file with the same filename. The backend verifies the server's
certificate and hostname; a missing certificate produces a clear error in the
server logs instead of disabling verification. Keep `RIDEIT_TOKEN_SECRET` set
in Render as well, then save and redeploy.

After deploying, open `/api/health`. A healthy database returns HTTP 200 with
`success: true`. HTTP 500 means the connection still needs attention; inspect
the Render runtime logs for `Database health check failed` and its traceback.

Run locally from the repository root with `python backend/app.py`. The API
listens on port 5000. For the mobile app, set `EXPO_PUBLIC_API_URL` in the root
`.env` to the backend URL. A physical phone needs the computer's LAN address,
not `localhost`. Without an override, the app uses the existing Render URL.

On Render, retain the existing start command (`gunicorn app:app` when its root
directory is `backend`). Redeploy the backend before using the new mobile login.
The new login response must include `access_token` and `expires_in`.

`users.account_type` must allow `Admin` as well as `Commuter` and `Driver`.
Create an ordinary account and assign its admin role privately using your
database editor. Public registration deliberately rejects `Admin`.

`POST /api/login` issues a signed access token that expires after one hour.
`GET /api/admin/stats` requires `Authorization: Bearer <access_token>` and checks
the account's current database role on every request. Total users includes admin
accounts. Invalid or expired tokens return 401; non-admin accounts return 403.
The mobile app keeps tokens only in memory and clears its session on logout or
expiration, so restarting the app requires signing in again. Logout does not
revoke a copied token; it remains valid until expiry, account deletion, role
removal, or signing-key rotation.

Run isolated API tests from the repository root:

```sh
python -m unittest discover -s backend/tests -v
```

Tests replace the database with a mock and never contact the real MySQL server.
