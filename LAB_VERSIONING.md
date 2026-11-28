# LifeAfterLogic Lab — Versioning Standard

This is a standing rule for every experiment published in the LifeAfterLogic Lab.

## Non-negotiable rule

**Never overwrite or discard an earlier experiment build.** Every meaningful iteration must be preserved and remain accessible from that experiment's own page.

## Required workflow

1. The first published iteration is `v.01`.
2. Before changing an existing build, preserve its exact source in that experiment's `versions/v.XX/source.html` (or the equivalent source files for multi-file projects).
3. Keep a playable archive at `versions/v.XX/`. Adjust only relative asset paths needed to make the archived copy run from its versioned URL; keep the exact original source separately.
4. Increment the version for each meaningful revision: `v.02`, `v.03`, and so on.
5. Add or update a visible **Version history** section on the experiment's current page. Link every preserved playable version and identify the current build.
6. Add a short note for each archived version explaining what it contains and any known issues.
7. Do not call a build finished until its current page and older version links are committed and checked.

## Scope

This applies to all LifeAfterLogic Lab experiments: existing projects when they are next revised, and every new project from its first published version. Keep the history on the experiment page itself, not only in Git commit history.

## Current example

`stochastic-ink/` follows this structure: v.01, v.02 and v.03 are preserved as playable archives, with v.04 as the current WebGL2 micro-particle and connected-filament iteration.
