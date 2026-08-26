# Product Requirement Workspace

Use `$lightweight-requirement-workflow` for new, continued, revised, or reviewed product requirements.

## Paths

- Requirements: `documents/product_requirements/{requirement_name}/`
- Knowledge base: `documents/knowledge_base/`
- Requirement directories: English `snake_case`
- Document language: follow the user's language

## Gates

Do not generate the document suite before the requirement summary is explicitly confirmed. Do not generate SVG before documents are confirmed. Confirm visual direction before HTML. Do not run self-review before HTML is confirmed or skipped. Never write the knowledge base until its draft is explicitly confirmed.

Treat `.workflow/state.json` as the state source and `decision_log.md` as the audit log. A file's existence does not prove user confirmation.

## Boundaries

Do not sync external task systems, send messages, deploy prototypes, commit code, or write external knowledge bases unless the user explicitly requests that separate action.
