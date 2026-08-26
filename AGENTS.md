# Repository Guidance

This repository packages a Codex Plugin. Keep the workflow deterministic, gated, and self-contained.

## Required checks

Run before completion:

```bash
node scripts/validate-repo.mjs
node --test tests/*.test.mjs
```

Do not introduce network dependencies into generated HTML prototypes or machine-specific absolute paths into Plugin files. Do not change state schema, stage order, or gate meanings without updating tests, version, changelog, and migration guidance.
