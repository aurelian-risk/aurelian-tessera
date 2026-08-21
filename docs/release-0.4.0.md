# Aurelian Tessera++ 0.4.0

`dist/index.html` - 4.26 MB. 247 end-to-end checks against this build, 59 against the
published catalogue.

## New

- On a kill-chain step, the last entry of the measure list writes the measure that does not
  exist yet, as a full form with the step it acts on already filled in. Everything recorded
  is in that list already, the catalogue being imported into it.

## Changed

- A measure sitting on an attack step is in use by that fact, so the switch that would take
  it out of use is refused in that direction. The refusal names what holds it rather than
  counting it.
