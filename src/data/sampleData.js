/*
 * ==========================================================================
 *  SAMPLE DATA — FICTIONAL
 *  Every artist and track below is invented for this portfolio build.
 *  No real music service is connected. Components should not import this
 *  file directly: go through src/services/catalogue.js so it can be
 *  swapped for the FastAPI backend later.
 * ==========================================================================
 */

export const artists = [
  { id: 'ar-velvet-meridian', name: 'Velvet Meridian', genre: 'Dream pop', origin: 'Glasgow', monthlyListeners: 412000 },
  { id: 'ar-odessa-vale', name: 'Odessa Vale', genre: 'Neo-soul', origin: 'London', monthlyListeners: 286000 },
  { id: 'ar-kites-over-lagos', name: 'Kites Over Lagos', genre: 'Afro-jazz', origin: 'Lagos', monthlyListeners: 198000 },
  { id: 'ar-hollow-static', name: 'The Hollow Static', genre: 'Post-punk', origin: 'Manchester', monthlyListeners: 154000 },
  { id: 'ar-mira-okafor', name: 'Mira Okafor', genre: 'Modern classical', origin: 'Dublin', monthlyListeners: 97000 },
  { id: 'ar-lumen-drift', name: 'Lumen Drift', genre: 'Electronica', origin: 'Berlin', monthlyListeners: 523000 },
  { id: 'ar-saffron-tapes', name: 'Saffron Tapes', genre: 'City pop', origin: 'Osaka', monthlyListeners: 341000 },
  { id: 'ar-ferro-glass', name: 'Ferro & Glass', genre: 'Experimental', origin: 'Reykjavík', monthlyListeners: 64000 },
  { id: 'ar-juniper-north', name: 'Juniper North', genre: 'Folk', origin: 'Bristol', monthlyListeners: 228000 },
  { id: 'ar-quiet-orchard', name: 'Quiet Orchard', genre: 'Indie rock', origin: 'Leeds', monthlyListeners: 176000 },
  { id: 'ar-ruby-aldana', name: 'Ruby Aldana', genre: 'Latin alternative', origin: 'Mexico City', monthlyListeners: 389000 },
  { id: 'ar-tidewater-choir', name: 'Tidewater Choir', genre: 'Post-rock', origin: 'Cardiff', monthlyListeners: 112000 },
];

export const tracks = [
  { id: 'tr-001', title: 'Satellites in Slow Motion', artistId: 'ar-velvet-meridian', duration: 254, year: 2025, mood: 'Dreamy' },
  { id: 'tr-002', title: 'Glasshouse Summer', artistId: 'ar-velvet-meridian', duration: 221, year: 2024, mood: 'Warm' },
  { id: 'tr-003', title: 'Honey Under Streetlights', artistId: 'ar-odessa-vale', duration: 238, year: 2025, mood: 'Soulful' },
  { id: 'tr-004', title: 'Second Language', artistId: 'ar-odessa-vale', duration: 197, year: 2023, mood: 'Intimate' },
  { id: 'tr-005', title: 'Harmattan Blue', artistId: 'ar-kites-over-lagos', duration: 312, year: 2025, mood: 'Uplifting' },
  { id: 'tr-006', title: 'Concrete Lullaby', artistId: 'ar-hollow-static', duration: 186, year: 2024, mood: 'Restless' },
  { id: 'tr-007', title: 'Nothing Left to Signal', artistId: 'ar-hollow-static', duration: 203, year: 2025, mood: 'Brooding' },
  { id: 'tr-008', title: 'Études for an Empty Room', artistId: 'ar-mira-okafor', duration: 347, year: 2024, mood: 'Reflective' },
  { id: 'tr-009', title: 'Afterglow Protocol', artistId: 'ar-lumen-drift', duration: 289, year: 2025, mood: 'Hypnotic' },
  { id: 'tr-010', title: 'Night Bus to Nowhere', artistId: 'ar-lumen-drift', duration: 264, year: 2023, mood: 'Nocturnal' },
  { id: 'tr-011', title: 'Weekend in Cassette', artistId: 'ar-saffron-tapes', duration: 232, year: 2024, mood: 'Nostalgic' },
  { id: 'tr-012', title: 'Magnetic North', artistId: 'ar-ferro-glass', duration: 401, year: 2025, mood: 'Curious' },
  { id: 'tr-013', title: 'Salt on the Window', artistId: 'ar-juniper-north', duration: 215, year: 2024, mood: 'Tender' },
  { id: 'tr-014', title: 'Paper Planes, Low Tide', artistId: 'ar-quiet-orchard', duration: 243, year: 2025, mood: 'Bittersweet' },
  { id: 'tr-015', title: 'Fuego Lento', artistId: 'ar-ruby-aldana', duration: 228, year: 2025, mood: 'Sultry' },
  { id: 'tr-016', title: 'The Long Way Through the Dark', artistId: 'ar-tidewater-choir', duration: 482, year: 2024, mood: 'Cinematic' },
];

const artistById = Object.fromEntries(artists.map((a) => [a.id, a]));

/** Tracks with their artist's name and genre attached, for display. */
export const tracksWithArtists = tracks.map((t) => ({
  ...t,
  artistName: artistById[t.artistId]?.name ?? 'Unknown artist',
  genre: artistById[t.artistId]?.genre ?? '',
}));

export function getArtist(id) {
  return artistById[id];
}
