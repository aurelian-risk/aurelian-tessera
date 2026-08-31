"""Route a component's visible strings through t(key, authored).

Only two shapes, both unambiguous:
  >Some text<                       JSX text between tags
  title="..." placeholder="..." aria-label="..."

Everything else is left alone deliberately: a string inside an expression can be a
className, an id, a route or a comparison, and getting one of those wrong is silent.
"""
import re, sys, pathlib

ATTRS = ("title", "placeholder", "aria-label")

# Whether a run that starts lower-case may be taken. See `jsx` below for the conditions.
LOWER = False

def slug(text, used):
    """One key per TEXT, not per occurrence.

    The same sentence in three places must share one key, or a translator writes it three
    times and the three drift apart the moment one is corrected — and under the lookup rule
    a stale translation does not fail, it simply shows. Only genuinely different texts that
    happen to slug the same get a numbered suffix.
    """
    if text in used:
        return used[text]
    w = re.findall(r"[A-Za-z]+", text.lower())[:4]
    base = "-".join(w) or "text"
    taken = set(used.values())
    k, n = base, 2
    while k in taken:
        k, n = f"{base}-{n}", n + 1
    used[text] = k
    return k

def run(path, area, apply=True, lower=False):
    global LOWER
    LOWER = lower
    src = pathlib.Path(path).read_text()
    out, used, changed = src, {}, []

    def jsx(m):
        text = m.group(1)
        if not re.search(r"[A-Za-z]{2}", text) or "{" in text or "}" in text:
            return m.group(0)
        # The `>` before it does not have to close a TAG: `recs.length > LIMIT && (` sits
        # between a `>` and the `<span` on the next line, reads as prose to the pattern,
        # and rewriting it is a syntax error. Prose does not carry an operator or a
        # statement end, and its brackets are closed - code caught mid-expression is not.
        if re.search(r"&&|\|\||=>|\bnull\b", text):
            return m.group(0)
        if text.count("(") != text.count(")") or text.count("[") != text.count("]"):
            return m.group(0)
        stripped = text.strip()
        # A run that starts lower-case is usually the tail of a sentence the markup broke,
        # or a legend under a heading - real text, and 66 of them in this tree. It is also
        # where a code fragment caught between a `>` and a `<` looks most like prose, so it
        # is taken only as a SENTENCE: three words or more, and none of the punctuation a
        # statement carries. A single lower-case word stays as authored.
        if len(stripped) < 2:
            return m.group(0)
        if not stripped[0].isupper():
            if not LOWER or len(re.findall(r"[A-Za-z]{2,}", stripped)) < 3:
                return m.group(0)
            if re.search(r"[=`$;{}]|//|\bconst\b|\breturn\b", text):
                return m.group(0)
        # `&apos;` renders as an apostrophe in JSX TEXT and as six characters inside a JS
        # string. Moving the text without decoding changes what the reader sees.
        for ent, ch in (("&apos;", "'"), ("&quot;", '"'), ("&nbsp;", "\u00a0"),
                        ("&mdash;", "\u2014"), ("&ndash;", "\u2013"), ("&amp;", "&")):
            stripped = stripped.replace(ent, ch)
        lead = text[: len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()) :]
        # The source wraps a long sentence and indents the next line; HTML collapses that
        # run of whitespace to one space. A JS string keeps it, so the table would carry
        # the indentation of the file it came from and a translator would copy it back.
        stripped = " ".join(stripped.split())
        key = f"ui.{area}.{slug(stripped, used)}"
        changed.append((stripped, key))
        return f">{lead}{{tr({key!r}, {stripped!r})}}{trail}<"

    # The `<` that follows has to open a TAG. Without this the pattern also matches a
    # TypeScript generic — `new Map<string, Node>()` reads as ">…<" with prose between —
    # and rewriting one of those is a syntax error at best and silent at worst.
    # `</>` closes a fragment, so it is a tag end too - and a sentence sitting alone in one
    # is exactly the shape a hint takes. Left out of the first pass, it kept 7 texts English.
    out = re.sub(r">([^<>{}]{2,})<(?=/?[A-Za-z][A-Za-z0-9.]*[\s/>]|/>)", jsx, out)

    def attr(m):
        name, text = m.group(1), m.group(2)
        if len(text) < 3 or not text[0].isupper():
            return m.group(0)
        key = f"ui.{area}.{slug(text, used)}"
        changed.append((text, key))
        return f'{name}={{tr({key!r}, {text!r})}}'

    out = re.sub(r'\b(' + "|".join(ATTRS) + r')="([^"]{3,})"', attr, out)

    if apply and out != src:
        if 'from "../domain/i18n"' not in out and 'from "./domain/i18n"' not in out:
            rel = "./domain/i18n" if "/src/App" in path or path.endswith("src/App.tsx") else "../domain/i18n"
            first = re.search(r"^import .*$", out, re.M)
            out = out[: first.end() + 1] + f'import {{ t as tr }} from "{rel}";\n' + out[first.end() + 1 :]
        pathlib.Path(path).write_text(out)
    return changed

if __name__ == "__main__":
    path, area = sys.argv[1], sys.argv[2]
    for text, key in run(path, area):
        print(f"  {key:<44} {text[:52]}")
