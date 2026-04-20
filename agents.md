# AGENTS.md — Mobile Optimization for يتيم (Yetim)

## Sensitive File Exclusion

All agents (Cursor, Claude, Codex) must not read, index, summarize, quote, or share:

- `LOCAL_CREDENTIALS_REFERENCE.md`
- `user-credentials.json`

If credentials are required, request them from the user directly instead of scanning files.