# STONE — Ashfall

An original browser-based, top-down action RPG inspired by the **feel** of classic loot-driven isometric RPGs (not a recreation of another game's assets or world).

## Play
Open `index.html` in a modern browser, or deploy this repository to Vercel as a **static** site. No build command or dependencies are required.

## What is in this first playable build
- Three playable classes: Vanguard, Wayfinder, and Arcanist.
- Isometric (2.5D) world with diamond-ground geometry, 3D-styled buildings, stylized character/enemy artwork, directional walking and attack animations, spell effects, depth sorting, atmospheric lighting and collision with village buildings.
- Click-to-move / click-to-attack plus screen-relative WASD controls.
- Auto-attacks, three class skills, healing flasks, dodges, hit effects, enemy AI, bosses and respawns.
- An overworld and a repeatable crypt dungeon connected by a portal.
- Two story chapters, NPC conversations, kills, quest collectibles and boss objectives.
- Randomized gear with five item rarities, five equipment slots, loot drops, inventory management, shops and salvaging.
- Attribute points, talent specialization, class abilities, level scaling and a save file in browser localStorage.
- A fully custom-drawn game world, minimap, HUD, character panels and responsive desktop layout.

## Controls
| Input | Action |
| --- | --- |
| Left click ground | Move / steer; hold mouse to keep moving |
| Left click enemy | Target and auto-attack |
| WASD | Move |
| Q / E / R | Class abilities |
| Right click on battlefield | Cast Q ability |
| 4 | Healing flask |
| Space | Quick evade |
| F | Interact with nearby NPC or portal |
| I / C / T / J | Inventory / Character / Talents / Journal |
| Esc | Close a panel or dialogue |

## Import the Gridwright Free Sample (no purchase required)

The project includes \`gridwright.js\`, a built-in importer for the original Gridwright Isometric Hero Creator Free Sample ZIP. This is an **optional one-time browser import**.

1. Deploy or open STONE in a recent Chrome/Edge browser.
2. Before creating a character, select **IMPORT GRIDWRIGHT PIXEL ART ZIP**, or select **Settings → IMPORT / REPLACE ZIP** once in the game.
3. Choose the **original .zip file** supplied by Gridwright. Do **not** unzip it first.
4. The importer validates the archive, loads all 8 directional views / 11 animations for the Knight and Huntress, and stores the ZIP in that browser's IndexedDB. Subsequent sessions automatically reload the artwork.

While installed, the Vanguard uses Knight sprites; Wayfinder uses Huntress sprites; and Arcanist temporarily uses Knight casting sprites. The other enemies, buildings, terrain, and NPCs are still drawn using the prototype renderer. The free sample doesn't include a dedicated mage or monster set. The sample's character colors and equipment are predetermined; visible gear swaps are a later feature requiring layered sprite composition and the full asset pack.

**Copyright and license:** Gridwright's \`LICENSE.txt\` permits incorporation into personal and commercial games, and modification for your game, but prohibits redistribution of the standalone asset files. For that reason, the uploaded ZIP and raw source sprites are **not committed to this public repository**. The browser uses local-only import and storage; its content does not leave the player's device. Credit (appreciated but not required): Art by Gridwright.

The import system supports the ready-made 1× and 2× Knight and Huntress sprite sheets from the Free Sample and falls back to the existing Canvas art if the sprite pack has not been imported, can't be decoded, or is removed in Settings.

## Technical notes
This is a **single-player vertical slice**, not yet an MMO. All data is stored locally in the current browser/device. True multiplayer will require user accounts, authoritative servers, shared world state and a backend/database. The engine is deliberately dependency-free for easy Vercel deployment and rapid iteration.

## Graphics direction
The game has been upgraded from an orthographic placeholder renderer to an original isometric (2.5D) visual engine in `visual.js`. This is a significant improvement in camera angle, perceived depth, animated characters, props, lighting, and environmental detail, but the current artwork is still generated using Canvas and **not yet a professional, hand-authored sprite/animation atlas**. The logical game coordinates and save format are unchanged by this visual overhaul, so existing saved characters continue to work.

Next art milestones: 8-direction sprite sheets for heroes and enemies; cohesive environment tiles, houses and trees; upgraded telegraph/combat VFX; better environment collisions, and occlusion-aware structures. Avoid using other games' copyrighted sprites.

The visuals, characters, item names, combat systems and lore are original.
