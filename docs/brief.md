# ASTRA — Project Brief & Development Instructions

## 1. Project Overview

ASTRA is a modern, atmospheric music discovery platform designed to help people discover artists, genres and sounds beyond their usual listening habits.

Tagline: Every sound opens a new universe.

ASTRA should feel like a premium, independent music discovery experience. It should not look like a generic music streaming clone.

The purpose is to encourage exploration, musical curiosity and discovery.

## 2. Technology Stack

Frontend:
- React
- JavaScript
- HTML
- CSS

Backend:
- Python
- FastAPI

Use a modular, reusable component architecture.

Build the frontend first using realistic sample data. Keep the architecture ready for future API and backend integration.

Do not introduce unnecessary frameworks or dependencies.

## 3. Brand Identity

Brand direction: Atmospheric Cosmic.

The visual identity should feel:
- Atmospheric
- Modern
- Gender-neutral
- Cinematic
- Creative
- Sophisticated
- Exploratory

Avoid:
- Overly feminine styling
- Excessive pink or pastel colours
- Cartoon planets
- Glitter and decorative stars everywhere
- Generic streaming platform layouts
- Overly futuristic neon styling

Use cosmic imagery subtly through gradients, orbital shapes, atmospheric lighting and abstract sound visualisations.

## 4. Official Colour Palette

Use these exact brand colours:

- Cosmic Charcoal: #19191F
- Deep Graphite: #292730
- Smoky Plum: #403647
- Nebula Violet: #695879
- Atmospheric Lilac: #A493B5
- Burnt Copper: #9A664B
- Clay Copper: #BF8062
- Dusty Terracotta: #E2AC91
- Starlight Ivory: #E7E0D5
- Ash Grey: #A9A5AC

Colour usage:
- Dark charcoal is the main background.
- Graphite and smoky plum are used for surfaces and cards.
- Violet and lilac are secondary accents.
- Copper and terracotta are warm highlights.
- Ivory is the main text colour.
- Ash grey is used for secondary text.

Do not introduce additional brand colours without asking first.

## 5. Typography

Use three font families:

Space Grotesk:
- Brand name
- Main headings
- Feature titles

Inter:
- Body text
- Buttons
- Navigation
- Interface labels

DM Mono:
- Track information
- Metadata
- Small technical labels

Typography scale:
- Display: 48px
- H1: 32px
- H2: 24px
- H3: 18px
- Body: 14px
- Small: 12px
- Metadata: 11px

## 6. Interface Styling

Use:
- Dark atmospheric backgrounds
- Subtle radial gradients
- Restrained glass effects
- Soft borders
- Rounded cards
- Clear spacing
- Consistent typography
- Responsive layouts

Suggested styling:
- Standard card radius: 18px
- Feature card radius: 22px
- Button radius: 10–12px
- Search field radius: 14px
- Subtle borders using translucent ivory
- Copper primary buttons with dark text
- Transparent secondary buttons with lilac borders

Prioritise accessibility, contrast and readability.

## 7. Main Application Features

Build the following main sections:

### Discover
The main landing page.
- Featured music
- Recommended artists
- New releases
- Curated collections
- Music discovery cards

### Explore
A way to discover music through:
- Mood
- Genre
- Atmosphere
- Artists
- Related musical styles

### Your Frequency
An interactive musical identity experience.

Users answer questions about their musical preferences and receive a musical identity based on their answers.

The experience should:
- Ask questions about musical taste
- Identify dominant musical preferences
- Generate a musical identity
- Show a breakdown of musical influences
- Provide personalised recommendations
- Allow users to revisit their results

This is about musical preferences, not personality or psychological assessment.

### Music Player
Include:
- Album artwork
- Track title
- Artist name
- Spotify-hosted playback controls for Spotify tracks; ASTRA does not stream or host audio
- Queue navigation (previous and next)
- Playback progress supplied by the Spotify embed
- Optional audio-reactive visualiser with glass-like orbital forms and glowing artwork. Sync requires the user to share the Spotify browser tab with audio; analysis stays in the browser and is not recorded or uploaded.
- Label sample tracks as fictional and unplayable; never simulate playback for them

### My Universe
A personal music library containing:
- Saved tracks
- Favourite artists
- Playlists
- Saved discoveries
- Musical identity

## 8. Musical Identities

Use these initial concepts as potential musical identities:

1. The Dreamer
2. The Soul
3. The Explorer
4. The Rebel
5. The Observer
6. The Pulse
7. The Nostalgic
8. The Alchemist

These should be developed into meaningful recommendation categories rather than arbitrary personality labels.

Users may have a dominant identity and secondary musical influences.

## 9. Reusable Components

Build reusable React components for:
- Primary buttons
- Secondary buttons
- Search bars
- Music cards
- Artist cards
- Navigation
- Music player
- Featured collections
- Recommendation sections
- Identity result cards

Keep components organised and avoid duplicating code.

## 10. Responsive Design

The application must work on:
- Mobile
- Tablet
- Desktop

Use mobile-first responsive design.

Suggested reference sizes:
- Mobile: 390px
- Tablet: 768px
- Desktop: 1440px

Navigation and layouts should adapt appropriately to screen size.

## 11. Development Instructions

Before making changes:
1. Inspect the existing project files.
2. Understand the existing structure.
3. Read the design reference images in the design folder.
4. Identify what already exists.
5. Do not overwrite working code unnecessarily.

Build the application in stages.

Stage 1: Project structure, design tokens, global styling and background.

Stage 2: Reusable components and navigation.

Stage 3: Discover page.

Stage 4: Explore page.

Stage 5: Your Frequency quiz and results.

Stage 6: Music player.

Stage 7: My Universe.

Stage 8: Responsive refinements and testing.

Do not attempt to build every feature in one enormous change.

After each stage:
- Explain what has been created.
- List the files changed.
- Explain how to run and test it.
- Identify anything that still needs implementing.

Do not invent working API integrations. Use clearly labelled sample data until real services are configured.

Maintain the ASTRA visual identity consistently throughout the project.

The objective is a polished, professional and functional music discovery application suitable for a developer portfolio.
