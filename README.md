# 全球利率 Dashboard

Local and publishable dashboard for comparing policy rates, mortgage rates, personal credit rates, and stock collateral / margin financing rates.

## Run locally

```bash
npm run refresh
npm run preview
```

Open `http://localhost:4173`.

## Publish online

This repository deploys the static `public/` folder with GitHub Pages.

After pushing to `main`, GitHub Actions runs `Deploy GitHub Pages` and publishes the dashboard at:

```text
https://chouhsuan1202.github.io/interest-rate-dashboard/
```

## Offline fixture mode

```bash
RATES_FIXTURE=1 npm run refresh
```

## Data quality labels

- `official`: central bank or regulator source
- `market`: market or comparison-site quote
- `broker`: broker-published financing schedule
- `manual`: manually maintained value with source link
- `unavailable`: no reliable current value

## Public sharing path

The `public/` folder is static and can later be deployed to GitHub Pages, Vercel, Netlify, or another static host. Do not add private notes or credentials to files under `public/`.
