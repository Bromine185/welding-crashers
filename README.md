# Welding Crashers

A browser-based first-person 3D game built with [Three.js](https://threejs.org/) and [Vite](https://vite.dev/). You are the last engineer aboard a damaged spaceship: boarders have cut the hull open in five places and a saboteur is loose in Engineering. There are no "weapons" in this game — only welding tools, and they're all you've got.

## Story & objective

Seal all five hull breaches by aiming a lit welding tool at them, defeat the saboteur, and keep your health above zero. Three friendly NPCs help you along the way; three hostile ones try to stop you.

- **Win:** every breach repaired *and* the saboteur defeated
- **Lose:** your health reaches zero

## Controls

| Input | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| Mouse | Look |
| `Shift` | Sprint |
| `Space` | Jump |
| Left click (hold) | Fire the equipped tool |
| `1` / `2` / `3` | Switch tool |
| `E` | Talk to the Captain (when nearby) |

## The welding tools

There are no guns here — every offensive and utility tool is a welding tool, consistent with the ship's fiction:

- **Keyhole Welder** *(1)* — primary continuous beam. Builds heat while firing and cools while idle; oversustain it and it overheats and locks out briefly.
- **Arc Welder** *(2)* — secondary arc gun. Fires discrete shots that consume wire-feed, and can arc a second nearby hostile if one is close to the first hit.
- **Plasma Cutting Torch** *(3)* — short-range, high-burst tool, limited by fuel. Also the only tool that can cut open sealed crates.

Any of the three can repair a hull breach — hold it on the glowing breach point until it's sealed.

## The crew

**Hostile:**
- **Hull Breach Drones** — small flying ram-attackers that patrol, then chase and ram once they spot you.
- **The Saboteur** — a boarder with their own cutting torch; patrols Engineering and fires on sight.
- **Corroded Sentry Turret** — a wall-mounted, stationary turret that opens fire on anything in its line of sight.

**Friendly:**
- **Riveter** (Engineer Ally) — follows you and fights back against nearby hostiles.
- **Suture** (Medic Bot) — follows you and heals you over time when you're hurt.
- **The Captain** — stationary on the Bridge; narrates mission progress and can be talked to.

## Running it locally

Requires Node.js.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to `http://localhost:5173`). To use a specific port:

```bash
npm run dev -- --port 3000
```

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

## Tech notes

- No backend and no external asset files — every sound effect is synthesized at runtime with the Web Audio API, and all geometry is built procedurally from Three.js primitives.
- NPCs are simple client-side finite state machines (patrol/alert/chase/attack, or follow/heal for allies) — there's no real multiplayer.
- A single pure-function AABB collision/raycasting module (`src/world/Collision.js`) backs movement, line-of-sight checks, and every weapon hitscan.
- Rendering uses bloom post-processing (`UnrealBloomPass`) for the ship's emergency-lighting look.

## Project structure

```
src/
  core/        Game loop, input, audio, post-processing
  world/       Ship level geometry, collision, starfield
  player/      First-person controller
  weapons/     The three welding tools + weapon switching
  npc/         NPC base class, state machines, and all six characters
  vfx/         Particle/spark/beam effects
  objectives/  Hull breach repair tracking and win condition
  ui/          HUD
```
