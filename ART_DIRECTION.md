# STONE / Art Direction & Asset Acquisition

The core game is a **2:1 isometric action RPG** with a fixed camera. The engine maps logical world positions into isometric screen positions and tracks each actor's feet for depth sorting and click targets.

## Priority: first full vertical slice

A coherent art direction matters more than a large number of unrelated packs. Create one village, one wilderness battle zone, one crypt, three heroes, four enemy types, one boss, and loot effects in **one style and scale**.

### Path A: Gridwright modular pixel art (best for equipment customization)

- Isometric Hero Creator: https://gridwrightstudio.itch.io/isometric-hero-creator-pixel-art-armor-weapons-8-directions
  - 8 directional views; idle, walk, run, attacks, spells, hurt, death, etc.
  - Separate weapon, helm, chest, leg, cape, hair and body layers, so changing gear can change character appearance.
  - Free knight and huntress samples available.
- Isometric Tiles: https://gridwrightstudio.itch.io/isometric-tileset-pixel-art-32x32-blocks-buildings
  - Matching terrain, roads, buildings, trees, props and shadows, with a free sample.
- Isometric Monsters: https://gridwrightstudio.itch.io/isometric-monsters-pixel-art-halloween-8-directions
- Isometric Characters: https://gridwrightstudio.itch.io/isometric-characters-pixel-art-8-directions-animated
- Bundle: https://gridwrightstudio.itch.io/ (listed Megabundle; verify current contents and price).
- All visual assets are designed for a 2:1 grid; content is pixel art. The publisher reports use of code and AI-assisted tools.
- Commercial-game use permitted under publisher terms, but standalone redistribution of asset files is not. **Do not commit purchased source artwork to this public GitHub repository.**

### Path B: Sova Digital HD 2.5D (best for more detailed overall art)

- Free sampler: https://sovdigital.itch.io/free-top-down-asset-pack
- Catalog: https://sovdigital.itch.io/
- Includes matching HD heroes, NPCs, bosses, tiles, buildings, effects and icons with 8-direction sprite sheets and many color variations.
- Caveat: the pack is described as top-down/2.5D and will need a perspective/anchor fit test with STONE's specific isometric projection before committing to a purchase.
- Free sampler includes characters, terrain, and effects; try it before buying.

### Path C: Free CC0 pipeline proof (not polished final art)

- Kenney Isometric Dungeon Tiles: https://kenney-assets.itch.io/isometric-dungeon-tiles
- CC0 (commercial use and redistribution permitted). Includes floors, walls, props, 8-direction animated hero.
- Suitable for proving tile batching and sprite animation loader. More stylized than the desired dark-fantasy look.

## Asset integration specification

1. Put cleared/license-compatible production art under `assets/visual/` **only if the license allows distribution in a public source repository**. For restricted packs, use a private repository or secure build pipeline; never expose download archives.
2. Build an asset manifest: id, image, frames, direction order, frames-per-second, loop mode, feet pivot, scale, hit frame, shadow layer.
3. Replace Canvas shape drawing incrementally using `drawImage`. Keep gameplay hitboxes and the existing `StoneVisual.project` function.
4. Convert movement vector into one of 8 sprite directions; use `idle`, `walk`, `attack`, `cast`, `hurt`, `death`, with frame rates from the pack.
5. Render the ground on a proper tile grid, then props, sorted actors, particles and in-world effects, using the sprite's **feet** as the depth-sort anchor.
6. Layer modular equipment graphics using the same directional animation frame as the base body. Tie visual equipment to the actual inventory `item.slot`.
7. Cache textures, avoid loading full texture sets up front, and test responsiveness on the target desktop browser and Vercel deployment.

## Current state

As of 2026-11-16, the Canvas isometric renderer's viewport-size bug is corrected. Visuals should once again draw terrain and characters. Browser-side full visual testing is still recommended. The project has no licensed third-party artwork bundled.
