# StrikeZone: Private Arena

A browser-based 3D multiplayer third-person shooter prototype set in a cinematic abandoned shipyard, built with Three.js, Express, and Socket.IO.

## Features
- Private 4-character room codes
- Room size: 2–8 players
- Automatic red/blue team balancing
- Five-minute matches
- Third-person over-the-shoulder movement and mouse-look
- Visible military operator with helmet, tactical vest, American flag shoulder patch, and carried rifle
- Abandoned shipyard environment with rusted cargo ship, gantry cranes, shipping containers, dock rails, puddles, weeds, bright blue sky, and cinematic lighting
- AK-inspired carried rifle, ammo/reload UI, muzzle flash and sound
- Player health, hit feedback, respawns, and kill/score tracking
- Responsive lobby and arena HUD
- Render-ready start command and health endpoint

## Run locally on Windows
1. Install Node.js 20 or newer.
2. Open PowerShell in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.
6. Create a room. Open the same address in a second browser/incognito window and join using the displayed code. You need at least two players to start a match.

## Publish on GitHub
1. Create a new GitHub repository named `strikezone-private-arena`.
2. Upload the contents of this folder (not the enclosing ZIP file). Do not upload `node_modules`.
3. Commit the files to the `main` branch.

## Deploy on Render
1. Sign in to Render and choose **New + → Web Service**.
2. Connect the GitHub repository.
3. Runtime: **Node**.
4. Build command: `npm install`
5. Start command: `npm start`
6. Create the Web Service. Render sets `PORT` automatically; the server reads it.
7. Open the deployed HTTPS URL. Test with two separate browsers/devices.

`/health` returns a small JSON response that can be used to check whether the server is running.

## Important prototype notes
This is an MVP/demo, not a production-secure competitive shooter. The shipyard is built from procedural 3D geometry, so it is a playable stylized environment rather than a photogrammetry-quality replica of the reference image. It uses basic client-reported positions and client-side ray checks, so movement and hit reporting need server-side validation before public competitive use. Room state is in memory and resets if the service restarts. A room is intended for a single running server instance. Three.js and Google Fonts are loaded from public CDNs, so the browser needs internet access. Match start requires at least two players.
