# Epic L — Local development infrastructure

How the app runs on a developer's own machine and in the e2e suite — not
a feature, and not owned by any single feature epic. Numbered separately
from the feature epics (01–05) since it cuts across all of them rather
than belonging to one.

Written retroactively alongside its first story, L1, which was already
built when this epic doc was requested — the point isn't to plan ahead of
the work, it's to give infrastructure stories the same home (an epic to
belong to, a handoff to record what happened) that every feature story
already has, rather than leaving them to invent their own convention.

---

## Conventions

Inherits this repo's existing behavioral rules unchanged — `AGENTS.md`,
`docs/CODE-REVIEW.md`'s blast-radius gate, the `/story` skill. Nothing
here introduces a new process.

## Non-goals

- **CI configuration.** None exists yet; adding it is a separate decision
  for a later story, not implied by this one.
- **Seeding or fixture data** beyond what an individual story needs.
- **Changes to the deployed path.** Production continues to run on
  Vercel and Neon exactly as before; this epic is local-only.

## Definition of done (epic-level)

A story is done when its own Definition of Done passes and
`npm run verify` exits 0. Infrastructure stories here typically have no
acceptance tests of their own — verification is the existing suite
passing against whatever the story changed, per each story's own DoD.

---

## Story L1 — Local Postgres for development and testing

Moves local development and the e2e suite off Neon and onto Postgres
running in Docker, in response to a real failure: Neon's monthly
transfer allowance was exhausted by accumulated e2e traffic, blocking
all local work. Neon stays exactly as it is for the deployed app. See
`docs/stories/L1-local-postgres.md`.

---

## Suggested build order

L1 first — later infrastructure stories, if any, depend on a working
local database existing at all.
