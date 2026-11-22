#!/usr/bin/env python3
"""Rebuild the catalog section of index.html from catalog.json.

    python3 build.py          rewrite index.html
    python3 build.py --check  exit 1 if index.html is out of date

Everything between the "catalog:start" and "catalog:end" comments in
index.html is generated; edit catalog.json, not that block.
"""
import json, re, sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).parent
START, END = "<!-- catalog:start -->", "<!-- catalog:end -->"
LINK_STYLES = {"button", "text", "app-store"}


def text(s):
    return escape(s, quote=False)


def link(l):
    href = escape(l["href"])
    ext = ' target="_blank" rel="noopener"' if l.get("newTab") else ""
    style = l.get("style", "text")
    if style not in LINK_STYLES:
        sys.exit(f"Unknown link style {style!r}; use one of {sorted(LINK_STYLES)}")
    if style == "app-store":
        return (f'<a class="store-badge" href="{href}"{ext}><img src="/badges/download-on-the-app-store.svg" '
                'width="132" height="44" alt="Download on the App Store"></a>')
    cls = "button" if style == "button" else "text-link"
    return f'<a class="{cls}" href="{href}"{ext}>{text(l["label"])}</a>'


def item(it):
    if it.get("icon"):
        mark = f'<img src="{escape(it["icon"])}" width="84" height="84" alt="">'
    elif it.get("markHtml"):
        mark = it["markHtml"]
    else:
        mark = f'<span>{text(it["name"][:1])}</span>'
    accent = f' style="--accent:{escape(it["accent"])}"' if it.get("accent") else ""
    out = [f'        <article class="item"{accent}>',
           f'          <div class="item-mark" aria-hidden="true">{mark}</div>',
           '          <div class="item-body">',
           f'            <h3>{text(it["name"])}</h3>',
           f'            <p>{text(it["blurb"])}</p>']
    st = it.get("status")
    if st:
        label = text(st["label"])
        if st.get("href"):
            label = f'<a href="{escape(st["href"])}">{label}</a>'
        out.append(f'            <p class="status">{label}</p>')
    if it.get("links"):
        out.append('            <div class="links">')
        out += [f'              {link(l)}' for l in it["links"]]
        out.append('            </div>')
    out += ['          </div>', '        </article>']
    return "\n".join(out)


def render(catalog):
    ids = {c["id"] for c in catalog["categories"]}
    for it in catalog["items"]:
        if it["category"] not in ids:
            sys.exit(f'{it["name"]}: unknown category {it["category"]!r}')
    groups = [(c, [i for i in catalog["items"] if i["category"] == c["id"]]) for c in catalog["categories"]]
    groups = [(c, items) for c, items in groups if items]  # empty categories stay hidden
    total = sum(len(items) for _, items in groups)
    out = ['      <nav class="filters" aria-label="Filter by category">',
           f'        <a class="chip" href="#work" data-filter="all" aria-current="true">All <span>{total}</span></a>']
    out += [f'        <a class="chip" href="#{c["id"]}" data-filter="{c["id"]}">{text(c["name"])} <span>{len(items)}</span></a>'
            for c, items in groups]
    out.append('      </nav>')
    for c, items in groups:
        out.append(f'      <section class="category" id="{c["id"]}" data-category="{c["id"]}" aria-labelledby="{c["id"]}-heading">')
        out.append(f'        <h2 id="{c["id"]}-heading">{text(c["name"])}</h2>')
        if c.get("blurb"):
            out.append(f'        <p class="category-blurb">{text(c["blurb"])}</p>')
        out += [item(i) for i in items]
        out.append('      </section>')
    return "\n".join(out), groups


def describe(groups):
    kinds = [c["name"].lower() for c, _ in groups]
    names = [i["name"] for _, items in groups for i in items]
    join = lambda xs: xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " and " + xs[-1]
    return f"Empty Sea Labs is an independent studio making {join(kinds)} for everyday life: {join(names)}."


def main():
    catalog = json.loads((ROOT / "catalog.json").read_text())
    path = ROOT / "index.html"
    old = path.read_text()
    if START not in old or END not in old:
        sys.exit("index.html is missing the catalog:start / catalog:end comments")
    block, groups = render(catalog)
    head, rest = old.split(START, 1)
    new = f"{head}{START}\n{block}\n      {END}{rest.split(END, 1)[1]}"
    new = re.sub(r'(<meta name="description" content=")[^"]*(")',
                 lambda m: m.group(1) + escape(describe(groups)) + m.group(2), new, count=1)
    if "--check" in sys.argv:
        sys.exit(0 if new == old else "index.html is out of date: run python3 build.py")
    path.write_text(new)
    print(f"index.html: {sum(len(i) for _, i in groups)} items in {len(groups)} categories")


if __name__ == "__main__":
    main()
