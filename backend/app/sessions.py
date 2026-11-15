"""
Minimal server-side session store for logged-in Spotify users.

The browser only gets an opaque, random, HttpOnly session id cookie;
Spotify tokens never reach JavaScript. Stored in memory, so sessions reset
when the server restarts. Fine for local development and a 5-user
Development Mode app; swap for Redis or a database if deploying at scale.
"""
import secrets
import time

SESSION_COOKIE = "astra_session"
STATE_COOKIE = "astra_oauth_state"

_sessions: dict[str, dict] = {}


def create_session(token_payload: dict) -> str:
    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = {}
    update_tokens(session_id, token_payload)
    return session_id


def update_tokens(session_id: str, token_payload: dict) -> None:
    session = _sessions.setdefault(session_id, {})
    session["access_token"] = token_payload["access_token"]
    session["expires_at"] = time.time() + token_payload.get("expires_in", 3600)
    # Spotify only sometimes returns a new refresh token; keep the old one otherwise.
    if token_payload.get("refresh_token"):
        session["refresh_token"] = token_payload["refresh_token"]


def get_session(session_id: str | None) -> dict | None:
    if not session_id:
        return None
    return _sessions.get(session_id)


def delete_session(session_id: str | None) -> None:
    if session_id:
        _sessions.pop(session_id, None)
