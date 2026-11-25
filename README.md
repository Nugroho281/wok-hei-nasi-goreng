# WOK HEI — Nasi Goreng Night Market

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Nugroho281/wok-hei-nasi-goreng/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Nugroho281/wok-hei-nasi-goreng/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A complete cooking game for the [make.fun "Make the best cooking game" bounty](https://make.fun/c/best-cooking-game-20261125-0137): run a nasi goreng stall at an Indonesian night market. One wok, six recipes, and customers who will not wait.

## How to play

1. **POTONG** — pick an ingredient (click a bin or press 1–9), then press **Space** at the chopping board to chop it onto your tray.
2. **WOK** — toss the tray into the wok with **Space**. While it cooks, toss again when the flame meter burns high: a **WOK HEI!** toss earns +25 points and cooks faster.
3. **SAJI** — plate the finished dish, then serve it to the matching order before its timer runs out.

Move with **← →** / **A D** or by clicking a station. **X** empties the tray, **P** pauses. One shift lasts 3 minutes; the dinner rush in the last minute brings orders faster. Serve dishes quickly to build a combo.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no assets outside `game/` — every pixel and sound is drawn or synthesised in code (vanilla JS + canvas + WebAudio).

## Layout

- `game/index.html` + `game/src/` — the game (`config.js` tuning, `recipes.js` the 6 recipes, `world.js` rules, `render.js` all drawing, `input.js`, `audio.js`, `shots.js` screenshot scenes, `main.js` boot/loop)
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — real renders of the game in headless Chrome (`shots.json` lists the `?shot=` scenes)
- `vendor/makefun-game.ts` — the kit's library, unchanged
