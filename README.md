# Ryan Pan — Personal Homepage

Live: https://pym96.github.io/

A static React + Vite portfolio with an animated ASCII black hole.

## Local development

Requires Node.js 22.13+.

```sh
npm ci
npm run dev
```

`npm run build` type-checks and builds `docs/`. `npm run preview` serves that output locally.

## Update content

- `src/projects.ts`: work entries, links, and release status.
- `src/App.tsx`: four categories and interaction.
- `src/globals.css`: responsive layout.
- `public/experiments/horizon/`: ASCII renderer.

Run `npm run build`, commit the updated source and `docs/`, then push to `main`. GitHub Pages automatically publishes from `main /docs` using its built-in deployment workflow. The generated `docs/` directory is tracked so publishing does not require a custom Actions workflow. No backend, API keys, or database are required.

## Credits

Black-hole renderer adapted from [SiddDevZ/horizon](https://github.com/SiddDevZ/horizon), MIT; original license retained in `public/experiments/horizon/LICENSE`. Portfolio adaptations add central drift, gravity-responsive labels, and collection transitions.

Background text: Friedrich Nietzsche, *Thus Spake Zarathustra*, Thomas Common translation, Prologue §1, [Project Gutenberg](https://www.gutenberg.org/ebooks/1998).
