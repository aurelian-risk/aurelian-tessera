# Aurelian Tessera++ 0.4.2

`dist/index.html` - 4.26 MB. 251 end-to-end checks against this build, 59 against the
published catalogue.

## Fixed

- **Published catalogues import whatever their line breaks.** The check deciding whether a
  file is a table read it line by line, so a requirement text running over several lines
  inside a quoted field looked like an unstable column count. The shape is judged on what
  the parser read now: all five bundled catalogues arrive, a 1189-requirement file in a
  tenth of a second.
- **The flow view keeps the reader's place when a node is selected.** Picking one narrows
  the lanes for a few frames, and the browser clamps the horizontal scroll to what fits in
  that moment. The position is captured on pointer-down and restored until it holds.
