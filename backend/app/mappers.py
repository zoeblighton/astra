"""
Convert Spotify's JSON into the shapes ASTRA's frontend components use.

Keeping this translation on the server means the React components don't
know or care whether data comes from Spotify, sample data or a future source.
"""


def _image(images: list | None, prefer: int = 300) -> str | None:
    """Pick the image closest to `prefer` px wide."""
    if not images:
        return None
    best = min(images, key=lambda img: abs((img.get("width") or prefer) - prefer))
    return best.get("url")


def _spotify_url(item: dict) -> str | None:
    return (item.get("external_urls") or {}).get("spotify")


def _first_genre(artist: dict) -> str | None:
    genres = artist.get("genres") or []
    return genres[0].capitalize() if genres else None


def search_artist(artist: dict) -> dict:
    return {
        "id": artist["id"],
        "type": "artist",
        "title": artist.get("name", ""),
        "subtitle": _first_genre(artist) or "Artist",
        "artistName": artist.get("name", ""),
        "imageUrl": _image(artist.get("images"), 64),
        "spotifyUrl": _spotify_url(artist),
    }


def search_track(track: dict) -> dict:
    artists = track.get("artists") or []
    artist_names = ", ".join(a.get("name", "") for a in artists)
    album = track.get("album") or {}
    return {
        "id": track["id"],
        "type": "track",
        "title": track.get("name", ""),
        "subtitle": f"{artist_names} · {album.get('name', '')}".strip(" ·"),
        "artistName": artists[0].get("name", "") if artists else "",
        "imageUrl": _image(album.get("images"), 64),
        "spotifyUrl": _spotify_url(track),
    }


def artist_detail(artist: dict, albums: list[dict]) -> dict:
    return {
        "id": artist["id"],
        "name": artist.get("name", ""),
        "genre": _first_genre(artist),
        "genres": artist.get("genres") or [],
        "imageUrl": _image(artist.get("images"), 640),
        "spotifyUrl": _spotify_url(artist),
        "albums": [
            {
                "id": album["id"],
                "title": album.get("name", ""),
                "releaseDate": album.get("release_date"),
                "type": album.get("album_type"),
                "imageUrl": _image(album.get("images"), 300),
                "spotifyUrl": _spotify_url(album),
            }
            for album in albums
            if album
        ],
    }


def user_profile(me: dict) -> dict:
    return {
        "id": me.get("id"),
        "displayName": me.get("display_name") or me.get("id"),
        "imageUrl": _image(me.get("images"), 64),
    }
