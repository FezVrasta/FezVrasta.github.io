# fezvrasta.github.io

Personal site and MDX blog, built with [Astro](https://astro.build).

## Development

```sh
npm install
npm run dev
```

## Structure

- `src/pages/index.astro`: homepage
- `src/components/ColonyField.tsx`: WebGL background (client island)
- `src/content/blog/*.mdx`: blog posts
- `src/pages/blog/`: blog index and post routes

## Deployment

Pushes to `master` build and deploy via the `Deploy to GitHub Pages` GitHub Actions workflow (`.github/workflows/deploy.yml`). In the repo's **Settings → Pages**, set the source to **GitHub Actions**.

## License

All rights reserved.
