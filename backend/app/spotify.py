"""
Thin async client for the Spotify Web API.

Two kinds of access:
  * App token (Client Credentials) — no user login; used for search,
    artists and albums. Cached and renewed automatically.
  * User tokens (Authorization Code) — after "Log in with Spotify"; used for
    the user's library and playback. Exchanged/refreshed here, stored in
    sessions.py.
"""
import asyncio
import base64
import time
from urllib.parse import urlencode

import httpx

from .config import settings

ACCOUNTS_URL = "https://accounts.spotify.com"
API_URL = "https://api.spotify.com/v1"

# Scopes requested at login. Only what ASTRA's features need.
USER_SCOPES = " ".join(
    [
        "user-read-private",
        "user-read-email",            # required by the Web Playback SDK
        "streaming",                  # Web Playback SDK (Premium listeners)
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-library-read",          # saved tracks
        "user-follow-read",           # followed artists
        "user-top-read",              # top artists/tracks
        "user-read-recently-played",
        "playlist-read-private",
        "playlist-modify-private",    # save discoveries as a playlist
    ]
)


class SpotifyError(Exception):
    """An error safe to show to the frontend."""

    def __init__(self, status: int, message: str, retry_after: str | None = None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.retry_after = retry_after


class SpotifyClient:
    def __init__(self, http: httpx.AsyncClient):
        self.http = http
        self._app_token: str | None = None
        self._app_token_expires_at = 0.0
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------ auth

    def _basic_auth_header(self) -> dict[str, str]:
        raw = f"{settings.client_id}:{settings.client_secret}".encode()
        return {"Authorization": "Basic " + base64.b64encode(raw).decode()}

    async def _token_request(self, data: dict) -> dict:
        response = await self.http.post(
            f"{ACCOUNTS_URL}/api/token", data=data, headers=self._basic_auth_header()
        )
        if response.status_code != 200:
            raise SpotifyError(
                502,
                "Could not authenticate with Spotify. Check SPOTIFY_CLIENT_ID and "
                "SPOTIFY_CLIENT_SECRET in backend/.env.",
            )
        return response.json()

    async def app_token(self) -> str:
        async with self._lock:  # one refresh at a time, even under concurrent requests
            if self._app_token and time.time() < self._app_token_expires_at - 60:
                return self._app_token
            payload = await self._token_request({"grant_type": "client_credentials"})
            self._app_token = payload["access_token"]
            self._app_token_expires_at = time.time() + payload.get("expires_in", 3600)
            return self._app_token

    def authorize_url(self, state: str) -> str:
        query = urlencode(
            {
                "response_type": "code",
                "client_id": settings.client_id,
                "scope": USER_SCOPES,
                "redirect_uri": settings.redirect_uri,
                "state": state,
            }
        )
        return f"{ACCOUNTS_URL}/authorize?{query}"

    async def exchange_code(self, code: str) -> dict:
        return await self._token_request(
            {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.redirect_uri,
            }
        )

    async def refresh_user_token(self, refresh_token: str) -> dict:
        return await self._token_request(
            {"grant_type": "refresh_token", "refresh_token": refresh_token}
        )

    # ------------------------------------------------------------- requests

    async def get(self, path: str, token: str, params: dict | None = None) -> dict:
        response = await self.http.get(
            f"{API_URL}{path}", params=params, headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            return response.json()
        if response.status_code == 429:
            raise SpotifyError(
                429, "Spotify rate limit reached. Try again shortly.",
                response.headers.get("Retry-After"),
            )
        if response.status_code == 401:
            raise SpotifyError(401, "Spotify session expired. Please log in again.")
        if response.status_code == 403:
            raise SpotifyError(
                403,
                "Spotify refused this request. It may be unavailable to "
                "Development Mode apps, or your account isn't on the app's user list.",
            )
        if response.status_code == 404:
            raise SpotifyError(404, "Not found on Spotify.")
        raise SpotifyError(502, f"Spotify returned an unexpected error ({response.status_code}).")

    async def app_get(self, path: str, params: dict | None = None) -> dict:
        return await self.get(path, await self.app_token(), params)
