/* publish-news.mjs
   Moves every pending item marked status:"approved" into news.json, sorts the
   list newest first, and clears them out of the pending file.

   Refuses to publish an item with no English note, because an entry with a bare
   headline and no context is the thing that makes a press page look automated.
   Run:  node scripts/publish-news.mjs
*/
import { readFile, writeFile } from 'node:fs/promises';

async function loadJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

const news = await loadJson('news.json', { items: [] });
const pending = await loadJson('pending-news.json', { items: [] });

const approved = [];
const held = [];
const rejected = [];

for (const item of pending.items) {
  if (item.status === 'rejected') { rejected.push(item); continue; }
  if (item.status !== 'approved') { held.push(item); continue; }

  const problems = [];
  if (!/^https?:\/\//i.test(item.url || '')) problems.push('url is not http(s)');
  if (!item.title_en) problems.push('title_en is empty');
  if (!item.note_en) problems.push('note_en is empty');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || '')) problems.push('date is not YYYY-MM-DD');

  if (problems.length) {
    console.warn(`HELD  ${item.id}: ${problems.join(', ')}`);
    held.push(item);
    continue;
  }

  approved.push({
    id: item.id,
    date: item.date,
    ...(item.date_precision ? { date_precision: item.date_precision } : {}),
    source: item.source,
    url: item.url,
    title_en: item.title_en,
    title_vi: item.title_vi || item.title_en,
    note_en: item.note_en,
    note_vi: item.note_vi || item.note_en,
  });
}

const byId = new Map(news.items.map((i) => [i.id, i]));
approved.forEach((i) => byId.set(i.id, i));

news.items = [...byId.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
news.updated = new Date().toISOString();

pending.items = held;
pending.updated = new Date().toISOString();

await writeFile('news.json', JSON.stringify(news, null, 2) + '\n', 'utf8');
await writeFile('pending-news.json', JSON.stringify(pending, null, 2) + '\n', 'utf8');

console.log(`published: ${approved.length}`);
console.log(`still pending: ${held.length}`);
console.log(`rejected and dropped: ${rejected.length}`);
console.log(`live total: ${news.items.length}`);
