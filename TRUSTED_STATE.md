# TRUSTED STATE

## Frontend commit
`4579834` — Restore Codex frontend production state

## Git tag
`stable-2026-05-09-ae3f95f3`

## Live Worker rollback version
`ae3f95f3-24fd-4c43-a95f-6b76a2e69d54`

## Stable markers
- `index.html` contains `app.js?v=20260509j`
- Exams dropdown has only `Browse all full exams` and `See all exam collections`
- `Start IELTS Test 1/2/3` are absent
- `premium-refresh.css` and `assignments.css` are absent
- `git status` is clean

## Emergency rollback command
```bash
npx wrangler rollback ae3f95f3-24fd-4c43-a95f-6b76a2e69d54
```

## Warnings
- Do not run `wrangler deploy` unless `worker.mjs` is verified against the stable Worker.
- Do not reapply the premium UI redesign unless rebuilt from commit `4579834`.
- Do not mix UI redesign with Worker/routing/auth/assignment changes.
