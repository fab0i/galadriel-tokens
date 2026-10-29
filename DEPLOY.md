# Deploy to Cloudflare Pages

```sh
pnpm install
pnpm wrangler login
pnpm pages:deploy           # production
pnpm pages:deploy:preview   # preview branch
```

`name` in `wrangler.jsonc` must match your Pages project. Only `dist/` gets uploaded.

Git-connected builds: build command `pnpm build`, output directory `dist`.
