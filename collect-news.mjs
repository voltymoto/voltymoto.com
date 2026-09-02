/* collect-news.mjs
   Runs on a schedule in GitHub Actions. Reads press mentions from RSS, drops
   anything already known or on the blocklist, and writes the survivors to
   pending-news.json for a human to approve.

   It never writes news.json. Nothing reaches the public page without review.
   Run:  node scripts/collect-news.mjs
*/
import { readFile, writeFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

/* ---------------------------------------------------------------- sources */
const Q = encodeURIComponent('"Volty U1" OR "NUEN MOTO" OR "Nuen Moto"');

const FEEDS = [
  { name: 'Google News VI', url: `https://news.google.com/rss/search?q=${Q}&hl=vi&gl=VN&ceid=VN:vi` },
  { name: 'Google News EN', url: `https://news.google.com/rss/search?q=${Q}&hl=en-US&gl=US&ceid=US:en` },
  /* Paste each Google Alerts RSS URL here once created. Alerts are slower and
     less complete than Google News, so they are a supplement, not the source. */
  // { name: 'Alert: Volty U1', url: 'https://www.google.com/alerts/feeds/XXXXXXXX/YYYYYYYY' },
];

/* Aggregators and scrapers that republish other outlets. Publishing these makes
   the same story appear two or three times under different mastheads. */
const BLOCK = [
  'vietnam.vn', 'baomoi.com', 'news.google.com', 'msn.com',
  'sohu.com', 'toutiao.com', '24h.com.vn/tin-tuc-trong-ngay',
];

/* Guards against a feed matching on an unrelated story. Both a brand token and
   a context token must appear before an item is considered. */
const MUST_MATCH = [/volty/i, /nuen\s*moto/i];
const CONTEXT = [/u1/i, /xe m[aá]y/i, /motorcycle/i, /điện|dien\b/i, /e-?bike/i, /EV\b/i];

/* ---------------------------------------------------------------- helpers */
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/* Google News wraps the real link. Unwrap it and strip tracking parameters so
   the same article from two feeds dedupes to one id. */
function cleanUrl(raw) {
  if (!raw) return null;
  let u = raw.trim();
  try {
    const parsed = new URL(u);
    const inner = parsed.searchParams.get('url');
    if (inner && /^https?:\/\//i.test(inner)) u = inner;
  } catch { return null; }
  try {
    const p = new URL(u);
    [...p.searchParams.keys()]
      .filter((k) => /^(utm_|fbclid|gclid|ref|source|cmpid)/i.test(k))
      .forEach((k) => p.searchParams.delete(k));
    p.hash = '';
    return p.toString();
  } catch { return null; }
}

function idFor(url) {
  const h = hostOf(url).split('.')[0] || 'src';
  const tail = url.replace(/\/+$/, '').split('/').pop().slice(0, 60)
    .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${h}-${tail}`;
}

function isoDate(s) {
  const d = new Date(s);
  return isNaN(d) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* Google News appends " - Publisher" to titles. */
function splitTitle(t) {
  const m = String(t).match(/^(.*)\s+-\s+([^-]+)$/);
  return m ? { title: m[1].trim(), source: m[2].trim() } : { title: String(t).trim(), source: '' };
}

async function readFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { 'user-agent': 'volty-news-collector/1.0 (+https://voltymoto.com)' },
  });
  if (!res.ok) {
    console.warn(`  ${feed.name}: HTTP ${res.status}`);
    return [];
  }
  const xml = await res.text();
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const list = Array.isArray(raw) ? raw : [raw];

  return list.map((it) => {
    const link = typeof it.link === 'string' ? it.link : it.link?.['@_href'] || '';
    const url = cleanUrl(link);
    const { title, source } = splitTitle(stripTags(it.title));
    return {
      url,
      title,
      source: source || it.source?.['#text'] || hostOf(url || ''),
      date: isoDate(it.pubDate || it.published || it.updated),
      summary: stripTags(it.description || it.content || '').slice(0, 400),
      via: feed.name,
    };
  }).filter((x) => x.url);
}

/* ------------------------------------------------------------------- main */
async function loadJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

const published = await loadJson('news.json', { items: [] });
const pending = await loadJson('pending-news.json', { items: [] });

const known = new Set([
  ...published.items.map((i) => i.id),
  ...pending.items.map((i) => i.id),
]);
const knownUrls = new Set([
  ...published.items.map((i) => cleanUrl(i.url)),
  ...pending.items.map((i) => cleanUrl(i.url)),
].filter(Boolean));

const found = [];
for (const feed of FEEDS) {
  console.log(`reading ${feed.name}`);
  try {
    found.push(...await readFeed(feed));
  } catch (e) {
    console.warn(`  ${feed.name}: ${e.message}`);
  }
}

const fresh = [];
const seen = new Set();

for (const item of found) {
  const host = hostOf(item.url);
  const hay = `${item.title} ${item.summary}`;

  if (BLOCK.some((b) => item.url.includes(b))) continue;
  if (!MUST_MATCH.some((re) => re.test(hay))) continue;
  if (!CONTEXT.some((re) => re.test(hay))) continue;

  const id = idFor(item.url);
  if (known.has(id) || knownUrls.has(item.url) || seen.has(id)) continue;
  seen.add(id);

  fresh.push({
    id,
    status: 'new',                 // set to "approved" after review
    date: item.date,
    source: item.source || host,
    url: item.url,
    title_en: item.title,
    title_vi: '',                  // fill in before approving
    note_en: '',                   // write the summary and any correction here
    note_vi: '',
    found_at: new Date().toISOString(),
    via: item.via,
  });
}

pending.items = [...fresh, ...pending.items];
pending.updated = new Date().toISOString();
await writeFile('pending-news.json', JSON.stringify(pending, null, 2) + '\n', 'utf8');

console.log(`\nnew candidates: ${fresh.length}`);
fresh.forEach((f) => console.log(`  ${f.date}  ${f.source}  ${f.title_en}`));
console.log(`pending total: ${pending.items.length}`);
