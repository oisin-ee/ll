## Commands

```
dev:       vite dev
build:     vite build
test:      vitest run
typecheck: svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
lint:      svelte-check --tsconfig ./tsconfig.json
format:    prettier --write .
e2e:       playwright test
```

Use these exact commands. Do not guess alternatives like `docker compose up`, `npm start`, etc.
