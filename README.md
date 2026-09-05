# voltymoto.com

Static marketing site for the Volty U1, an electric utility motorcycle by
NUEN MOTO. No build step: every page is a self-contained HTML file with its
CSS and JavaScript inline. Open any file directly, or serve the folder.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home |
| `u1.html` | The U1, specifications at `#specs` |
| `design.html` | How the U1 was designed |
| `accessories.html` | Accessories, marked coming soon |
| `rider-economics.html` | Running cost for a rider, estimator at `#sim` |
| `fleet-economics.html` | Running cost for a fleet |
| `contact.html` | Contact, reservations, fleet pilot, FAQ |
| `vision.html` | Company vision |
| `vehicle.html` | Vehicle detail |
| `audience.html` | Who the bike is for |
| `terms.html`, `privacy.html` | Legal |
| `fleet-tco.html` | Meta-refresh stub for an old URL |

## Languages

Every page carries English and Vietnamese in `data-en` and `data-vi`
attributes, toggled by the EN/VI control in the navigation. Vietnamese uses
Be Vietnam Pro, because the Latin display faces carry no Vietnamese glyphs.
All fonts are self-hosted in the repository root.

## Deploying

**Netlify** works as-is. `_redirects` is read automatically.

**GitHub Pages** serves the folder, but `_redirects` is a Netlify file and is
ignored, so the ten redirect rules will not apply and those old URLs will 404.
`.nojekyll` is present so Pages serves the files as-is rather than running
them through Jekyll, which would otherwise skip files whose names begin with
an underscore.

Set the publish directory to the repository root.

## Conventions

Photography ships at two widths, `-800` and `-1200`, wired through `srcset`.
Hero sections use a `webm` source, an `mp4` fallback and a `webp` poster.
Every `img` carries `width` and `height` matching the real file, so pages do
not shift as images load. Keep that true when swapping artwork.
