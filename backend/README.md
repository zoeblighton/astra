# ASTRA API

FastAPI backend that keeps Spotify credentials off the frontend and converts
Spotify data into the shapes ASTRA's React components use.

## Setup (once)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env   # then add your Spotify Client ID and Secret
```

## Run

```powershell
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive API docs: http://127.0.0.1:8000/docs

Restart the server after editing `.env` (settings are read at start-up).

## Deploying

The frontend is hosted on Netlify and this backend on Render (free tier),
configured by `netlify.toml` and `render.yaml` at the repo root. Netlify
proxies `/api/*` to Render, so the browser sees a single origin.

Render environment variables (Render → astra-api → Environment):

| Key | Value |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | from the Spotify dashboard |
| `SPOTIFY_REDIRECT_URI` | `https://<netlify-site>/api/auth/callback` (also add it in the Spotify dashboard) |
| `FRONTEND_URL` | `https://<netlify-site>` |

Free Render services sleep after 15 minutes idle and take about a minute to
wake; meanwhile the frontend shows its sample data. Sessions are in memory,
so a restart or sleep logs people out.

## Endpoints

| Method | Path | Login? | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | Status and whether Spotify credentials are set |
| GET | `/api/search?q=&limit=` | – | Artists and tracks (max 10) |
| GET | `/api/artists/{id}` | – | Artist plus up to 10 albums/singles |
| GET | `/api/auth/login` | – | Redirects to Spotify login |
| GET | `/api/auth/callback` | – | Spotify redirects here (must match the dashboard Redirect URI) |
| POST | `/api/auth/logout` | – | Ends the session |
| GET | `/api/me` | ✓ | Logged-in user's profile |

## Spotify Development Mode limits (as of 2026)

- The app owner needs Spotify Premium; up to **5** allowlisted users can log in.
- Not available to new apps: recommendations, related artists, audio features,
  preview clips, new releases, browse categories, artist top tracks,
  popularity and follower counts. Search returns at most 10 per type.
- When the API is unavailable, the frontend falls back to its labelled sample data.
