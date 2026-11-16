# STONE — Ashfall

An original browser-based, top-down action RPG inspired by the **feel** of classic loot-driven isometric RPGs (not a recreation of another game's assets or world).

## Play
Open `index.html` in a modern browser, or deploy this repository to Vercel as a **static** site. No build command or dependencies are required.

## What is in this first playable build
- Three playable classes: Vanguard, Wayfinder, and Arcanist.
- Click-to-move / click-to-attack plus optional WASD controls.
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

## Technical notes
This is a **single-player vertical slice**, not yet an MMO. All data is stored locally in the current browser/device. True multiplayer will require user accounts, authoritative servers, shared world state and a backend/database. The engine is deliberately dependency-free for easy Vercel deployment and rapid iteration.

The visuals, characters, item names, combat systems and lore are original. We can replace the procedural/vector art with a sprite atlas later while retaining game mechanics.
