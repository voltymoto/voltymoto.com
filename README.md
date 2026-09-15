# voltymoto.com

Static marketing site for the Volty U1, an electric utility motorcycle by
NUEN MOTO. No build step is needed to serve it: every page is a self-contained
HTML file with its CSS and JavaScript inline. Open any file directly, or serve
the folder.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: key numbers, why the U1, the U1-R and U1-F split |
| `u1.html` | The U1: design (`#design`), battery and charging (`#battery`), full specs (`#specs`) |
| `riders.html` | U1-R for everyday riders: price, running-cost calculator (`#numbers`), costs (`#costs`), FAQ |
| `fleets.html` | U1-F for fleets: configurations (`#fitted`), fleet calculator (`#yard`), total cost of ownership (`#tco`), FAQ |
| `audience.html` | The six working days the U1 is built for |
| `contact.html` | Sign-up form, fleet pilot, full FAQ |
| `accessories.html` | Accessories, marked coming soon and not linked from the navigation |
| `terms.html`, `privacy.html` | Legal |

`design.html`, `rider-economics.html`, `fleet-economics.html`, `vehicle.html`,
`vision.html` and `fleet-tco.html` are small redirect files for URLs retired in
the September 2026 rebuild. They send visitors to the page that replaced them.

## Prices

The ranges on the site are estimates for the first production batch, not
confirmed prices: U1-R ₫40M to ₫45M, U1-F ₫30M to ₫35M per unit. They appear on
`index.html`, `u1.html`, `audience.html`, `riders.html`, `fleets.html` and in the
price answer of the `contact.html` FAQ. Both calculators carry the same ranges as
constants (`PRICE_LO`, `PRICE_HI`), so change them in all of those places together.

## Languages

Every page carries its Vietnamese in `data-vi` attributes, swapped in by the
EN/VI control and remembered between pages. Vietnamese uses Be Vietnam Pro,
because the Latin display faces carry no Vietnamese glyphs. All fonts are
self-hosted in the repository root.

## Deploying

**Netlify** works as-is. `_redirects` is read automatically.

**GitHub Pages** serves the folder but ignores `_redirects`. The retired pages
still resolve through their redirect files; the older names listed only in
`_redirects` will 404 there. `.nojekyll` is present so Pages serves files whose
names begin with an underscore.

Set the publish directory to the repository root.

## Conventions

Photography ships at two widths, `-800` and `-1200`, wired through `srcset`.
Hero videos use a `webm` source where one exists, an `mp4` fallback and a poster.
Every `img` carries `width` and `height` matching the real file, so pages do not
shift as images load. Keep that true when swapping artwork.

The five main pages (`index`, `u1`, `riders`, `fleets`, `audience`) share one
stylesheet and script, generated from the builder kept beside this repository in
`voltymoto.com-builder`. Editing the HTML directly is fine; regenerating from the
builder overwrites those five files.
