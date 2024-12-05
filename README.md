# Astroflare

An opinionated starter for Astro on Cloudflare.

- Deploys to Cloudflare's global edge network
- Uses GitHub actions for its deploy pipeline, unlocking daily builds and PR previews.
- Uses the [@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) adapter and Astro's new intelligent `static` build mode. This allows you to opt-in to SSR on a per-route basis by adding `export const prerender = false` to a route.

## Getting started

Install dependencies:

```bash
npm install
```

Update the project's `name` in `wrangler.toml`. Commit this change, but don't push yet:

```toml
name = "astroflare" # change this to what you want your Cloudflare project's name to be
```

Build the site and deploy to Cloudflare. Wrangler will prompt you to create the Pages project as part of this step:

```bash
npm run build
npx wrangler pages deploy
```

Configure the following secrets in your repository (Settings > Secrets and Variables > Actions > New Repository Secret):

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID. You can get this from the Cloudflare URL after logging in (which will be of the form `dash.cloudflare.com/[account-id]`)
- `CLOUDFLARE_API_TOKEN` - A Cloudflare API token with the ability to modify your Pages project
- `GH_PAT` - A GitHub Personal Access Token with read-only access to your repo's contents (for private repos).

Push your repository to Github! You should see a pipeline run appear in the Actions tab of your repository. Once this completes successfully, your project is ready for development.

## FAQ

### How do I turn off daily builds?

Comment or remove the `cron` trigger in `.github/workflows/main.yml`.
