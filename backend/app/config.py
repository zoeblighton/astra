"""Settings loaded from backend/.env (see .env.example)."""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@dataclass(frozen=True)
class Settings:
    client_id: str
    client_secret: str
    redirect_uri: str
    market: str
    frontend_url: str
    cookie_secure: bool

    @property
    def spotify_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)


settings = Settings(
    client_id=os.getenv("SPOTIFY_CLIENT_ID", "").strip(),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET", "").strip(),
    redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8000/api/auth/callback").strip(),
    market=os.getenv("SPOTIFY_MARKET", "GB").strip(),
    frontend_url=os.getenv("FRONTEND_URL", "http://127.0.0.1:5173").strip().rstrip("/"),
    cookie_secure=os.getenv("COOKIE_SECURE", "false").strip().lower() == "true",
)
