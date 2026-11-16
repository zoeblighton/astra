"""
ASTRA API (FastAPI).

Run from backend/:  .venv\\Scripts\\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
Interactive docs:   http://127.0.0.1:8000/docs
"""
import asyncio
import secrets
import time
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Path, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse

from . import mappers, sessions
from .config import settings
from .spotify import SpotifyClient, SpotifyError

SPOTIFY_ID = r"^[A-Za-z0-9]{22}$"  # Spotify ids are 22 base-62 characters


@asynccontextmanager
async def lifespan(app: FastAPI):
    # One shared HTTP connection pool for the app's lifetime.
    async with httpx.AsyncClient(timeout=10) as http:
        app.state.spotify = SpotifyClient(http)
        yield


app = FastAPI(title="ASTRA API", version="0.1.0", lifespan=lifespan)


@app.exception_handler(SpotifyError)
async def spotify_error_handler(_request: Request, exc: SpotifyError):
    headers = {"Retry-After": exc.retry_after} if exc.retry_after else None
    return JSONResponse({"detail": exc.message}, status_code=exc.status, headers=headers)


def spotify(request: Request) -> SpotifyClient:
    if not settings.spotify_configured:
        raise HTTPException(503, "Spotify is not configured. Add your credentials to backend/.env.")
    return request.app.state.spotify


# --------------------------------------------------------------------- status

@app.get("/api/health")
async def health():
    return {"status": "ok", "spotifyConfigured": settings.spotify_configured}


# ------------------------------------------------------- catalogue (no login)

@app.get("/api/search")
async def search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(6, ge=1, le=10),
):
    data = await spotify(request).app_get(
        "/search",
        # Development Mode caps search at 10 per type.
        {"q": q, "type": "artist,track", "limit": 5, "market": settings.market},
    )
    artists = [mappers.search_artist(a) for a in data.get("artists", {}).get("items", []) if a]
    tracks = [mappers.search_track(t) for t in data.get("tracks", {}).get("items", []) if t]
    # Lead with the top two artist matches, then tracks.
    results = (artists[:2] + tracks + artists[2:])[:limit]
    return {"source": "spotify", "results": results}


@app.get("/api/artists/{artist_id}")
async def artist(request: Request, artist_id: str = Path(..., pattern=SPOTIFY_ID)):
    client = spotify(request)
    artist_data = await client.app_get(f"/artists/{artist_id}")
    albums = await client.app_get(
        f"/artists/{artist_id}/albums",
        {"include_groups": "album,single", "limit": 10, "market": settings.market},
    )
    return mappers.artist_detail(artist_data, albums.get("items", []))


# ------------------------------------------------- user login (5-user limit)

@app.get("/api/auth/login")
async def login(request: Request):
    client = spotify(request)
    state = secrets.token_urlsafe(24)
    response = RedirectResponse(client.authorize_url(state))
    response.set_cookie(
        sessions.STATE_COOKIE, state, max_age=600, httponly=True,
        samesite="lax", secure=settings.cookie_secure,
    )
    return response


@app.get("/api/auth/callback")
async def callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    client = spotify(request)
    expected_state = request.cookies.get(sessions.STATE_COOKIE)
    destination = f"{settings.frontend_url}/#/universe"

    if error or not code or not state or not expected_state or not secrets.compare_digest(state, expected_state):
        response = RedirectResponse(f"{settings.frontend_url}/?auth=failed#/universe")
        response.delete_cookie(sessions.STATE_COOKIE)
        return response

    tokens = await client.exchange_code(code)
    session_id = sessions.create_session(tokens)

    response = RedirectResponse(destination)
    response.delete_cookie(sessions.STATE_COOKIE)
    response.set_cookie(
        sessions.SESSION_COOKIE, session_id, max_age=60 * 60 * 24 * 14, httponly=True,
        samesite="lax", secure=settings.cookie_secure,
    )
    return response


@app.post("/api/auth/logout")
async def logout(request: Request):
    sessions.delete_session(request.cookies.get(sessions.SESSION_COOKIE))
    response = JSONResponse({"loggedIn": False})
    response.delete_cookie(sessions.SESSION_COOKIE)
    return response


async def user_token(request: Request) -> str:
    """Return a valid access token for the logged-in user, refreshing if needed."""
    session_id = request.cookies.get(sessions.SESSION_COOKIE)
    session = sessions.get_session(session_id)
    if not session:
        raise HTTPException(401, "Not logged in with Spotify.")
    if time.time() > session["expires_at"] - 60:
        if not session.get("refresh_token"):
            raise HTTPException(401, "Spotify session expired. Please log in again.")
        refreshed = await spotify(request).refresh_user_token(session["refresh_token"])
        sessions.update_tokens(session_id, refreshed)
    return session["access_token"]


@app.get("/api/me")
async def me(request: Request):
    token = await user_token(request)
    profile = await spotify(request).get("/me", token)
    return {"loggedIn": True, "user": mappers.user_profile(profile)}


LIBRARY_LIMIT = 20


@app.get("/api/me/library")
async def my_library(request: Request):
    """The logged-in user's liked songs, followed artists and playlists.

    Each section loads independently: if Spotify refuses one (Development Mode
    restrictions change), it comes back with available: false and the others
    still load. An expired session still raises 401 for the whole request.
    """
    token = await user_token(request)
    client = spotify(request)

    async def section(path: str, params: dict, extract) -> dict:
        try:
            items, total = extract(await client.get(path, token, params))
        except SpotifyError as exc:
            if exc.status == 401:
                raise
            return {"items": [], "total": 0, "available": False}
        return {"items": items, "total": total, "available": True}

    def liked(data: dict):
        tracks = [mappers.search_track(i["track"]) for i in data.get("items", []) if i and i.get("track")]
        return tracks, data.get("total", len(tracks))

    def followed(data: dict):
        page = data.get("artists") or {}
        artists = [mappers.search_artist(a) for a in page.get("items", []) if a]
        return artists, page.get("total", len(artists))

    def playlists(data: dict):
        lists = [mappers.playlist(p) for p in data.get("items", []) if p and p.get("id")]
        return lists, data.get("total", len(lists))

    liked_tracks, followed_artists, user_playlists = await asyncio.gather(
        section("/me/tracks", {"limit": LIBRARY_LIMIT, "market": settings.market}, liked),
        section("/me/following", {"type": "artist", "limit": LIBRARY_LIMIT}, followed),
        section("/me/playlists", {"limit": LIBRARY_LIMIT}, playlists),
    )
    return {
        "source": "spotify",
        "likedTracks": liked_tracks,
        "followedArtists": followed_artists,
        "playlists": user_playlists,
    }
