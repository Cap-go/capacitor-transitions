# Cap Transitions example app

Interactive vanilla JS demo for `@capgo/capacitor-transitions` (linked via `file:..`).

## Run locally

```bash
bun install
bun run start
```

From the repo root:

```bash
bun run example:build
```

## What to try

- Adjust platform, duration, easing, and swipe-back on the home screen.
- Open Alpha, Beta, or Gamma to push detail and nested pages with transitions.
- Use **Back**, **Pop**, or **Reset stack** to exercise `outlet.pop` and `setRoot`.
- Watch the event log for page lifecycle callbacks.
