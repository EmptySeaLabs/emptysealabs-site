# Empty Sea Labs site

The studio page served at https://emptysealabs.com by GitHub Pages (branch `main`, root). Plain HTML, CSS and a little JavaScript. The only build step is `build.py`, which needs nothing but Python 3.

## Adding something new

Everything the studio makes is listed in `catalog.json`. The home page's filter buttons, category sections, cards and search description are all generated from it.

1. Add an entry to `items` in `catalog.json`.
2. Run `python3 build.py`.
3. Commit `catalog.json` and `index.html` together.

An item:

| Field | Required | What it is |
| --- | --- | --- |
| `category` | yes | The `id` of a category |
| `name`, `blurb` | yes | Title and one short paragraph |
| `icon` | no | Path to a square image. Without one the card shows the first letter (or `markHtml`, raw HTML for a custom mark) |
| `accent` | no | Hover color for the card; defaults to sea |
| `status` | no | `label`, optional `href`: the small line under the blurb ("iPhone · now on the App Store", "In the works") |
| `links` | no | Each has `href` and a `style`: `button` (one per card), `text`, or `app-store` (the badge; no `label` needed). `"newTab": true` opens it in a new tab |

## Adding a category

Add `{ "id": "books", "name": "Books" }` to `categories` (an optional `blurb` shows under the heading). The order there is the order on the page. A category with no items stays hidden, so it is safe to add one ahead of time. Each category gets its own link, such as `emptysealabs.com/#games`.

`python3 build.py --check` exits with an error when `index.html` no longer matches `catalog.json`.

Bump `?v=` on `style.css` and `site.js` in every page when either file changes.
