# Issue tracker

Specs and issues for this repo live as **markdown files under `docs/specs/`**, numbered
in creation order (`0001-…`, `0002-…`). There is no GitHub remote and no `gh` CLI on
this machine, so nothing is published to a hosted tracker.

Skills that read or write issues (`to-spec`, `to-tickets`, `triage`, `qa`) should
create and update files here rather than calling a tracker CLI.

## Triage labels

There is no label system, so the canonical triage role is recorded as a **`Status:`
line in the spec's header**. The five canonical values are used unchanged:

`needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`

## Domain docs

Single-context: `CONTEXT.md` (glossary) and `docs/adr/` (architecture decision
records) at the repo root. Both are authoritative — a spec that contradicts an ADR
is wrong until the ADR is superseded.
