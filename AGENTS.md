# Video planner

Follow the foundation rules in [`rules/`](rules/):

- [rules/00-core.mdc](rules/00-core.mdc)
- [rules/01-tech-stack.mdc](rules/01-tech-stack.mdc)
- [rules/02-styling-rtl.mdc](rules/02-styling-rtl.mdc)
- [rules/03-seo-metadata.mdc](rules/03-seo-metadata.mdc)
- [rules/04-payload-crud.mdc](rules/04-payload-crud.mdc)
- [rules/05-components-ui.mdc](rules/05-components-ui.mdc)

Improve the current הפקות וידאו app in place. Do not remove or replace working productions, episodes, board, archive, assignment, or `/api/app` routes. Do not write Cursor rules under `.cursor/rules`.

Visual direction: TailAdmin-like admin chrome (sidebar, sticky header, gray canvas, white cards) with brand `#f50023` and Hebrew RTL. Restyle existing screens; do not install a second dashboard template.

Do not run `seed` on production. When schema changes, run `npm run sync:schema` after deploy (`git reset --hard origin/main` then `bash deploy/deploy.sh`).
