---
inclusion: auto
name: extending-the-project
description: How to add or change behaviour in CSV Quiz Generator without regressing what already works.
---

# Extending CSV Quiz Generator

Read `.kiro/spec/requirement.md` before changing behaviour. It is the source of truth.

## The rule that outranks the rest

**Additive, not alterative.** A new requirement extends the surface; it does not redefine the existing one.

## Order of work

1. **Spec first.** Add the behaviour to `requirement.md` as a new numbered requirement.
2. **Check it against the invariants** below.
3. **Place it on the right side of the module boundary.**
4. **Implement**, smallest change that satisfies the criteria.
5. **Run the regression pass** below.
6. **Record the change** in the traceability table.

## Where new work goes

| The request | Belongs in | Not in |
| --- | --- | --- |
| A new accepted header spelling | `ALIASES` in `js/validate.js` | anywhere else |
| A new answer notation | answer resolution in `js/validate.js` | `js/quiz.js` |
| A new delimiter or quoting case | `js/csv.js` | `js/validate.js` |
| A new game mode, order or scoring rule | `js/quiz.js`, behind an option | `js/app.js` |
| A new screen, control or rendering detail | `index.html` + `css/styles.css` + `js/app.js` | `js/quiz.js` |
| New demo or template content | `js/sample.js` | fetched from disk |

## Invariants

- No dependency, no build step, no `type="module"`, no `fetch()`, no `.innerHTML =`.
- New options default to off.
- Load order: `csv → validate → quiz → sample → app`.
- Every sheet valid today must stay valid.
- Line numbers stay aligned with rows across quoted multi-line fields.
- A new id in `cacheElements()` must exist in `index.html`.

## Do not touch

- `Sample/has-errors.csv` is broken on purpose — it is the validation report fixture.
- `Sample/messy-headers.csv` is semicolon-delimited with loose headers on purpose.
- The dial constant in `js/app.js` is derived from `r="52"` in `index.html`.