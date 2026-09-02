/* news-feed.js
   Renders the press list on /news.html from /news.json.

   The page ships with the current list already in the HTML. This script replaces
   it only once news.json has loaded and parsed. If the fetch fails, the network
   is slow, or JavaScript is off, the visitor still sees a complete list. Never
   let a press page depend on a script to have any content at all.
*/
(function () {
  var mount = document.getElementById('newslist');
  if (!mount || !window.fetch) return;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Only http(s) links are rendered. Anything else in the data file is a bug or
     an injection attempt, and a press page is not the place to find out. */
  function safeUrl(u) {
    if (typeof u !== 'string') return null;
    if (!/^https?:\/\//i.test(u)) return null;
    return u;
  }

  function fmtDate(item) {
    var p = String(item.date || '').split('-');
    if (p.length < 3) return esc(item.date || '');
    var y = p[0], m = parseInt(p[1], 10), d = parseInt(p[2], 10);
    var mon = MONTHS[m - 1] || '';
    if (item.date_precision === 'month') return mon + ' ' + y;
    return (d < 10 ? '0' + d : d) + ' ' + mon + ' ' + y;
  }

  function row(item) {
    var url = safeUrl(item.url);
    var titleEn = item.title_en || item.title || '';
    var titleVi = item.title_vi || titleEn;
    var noteEn = item.note_en || '';
    var noteVi = item.note_vi || noteEn;

    var head = url
      ? '<a href="' + esc(url) + '" target="_blank" rel="noopener"' +
        ' data-en="' + esc(titleEn) + '" data-vi="' + esc(titleVi) + '">' + esc(titleEn) + '</a>'
      : '<span data-en="' + esc(titleEn) + '" data-vi="' + esc(titleVi) + '">' + esc(titleEn) + '</span>';

    var go = url
      ? '<a class="go" href="' + esc(url) + '" target="_blank" rel="noopener"' +
        ' data-en="Read" data-vi="Đọc">Read</a>'
      : '<span class="go" data-en="Link pending" data-vi="Sắp có liên kết">Link pending</span>';

    var note = noteEn
      ? '<p data-en="' + esc(noteEn) + '" data-vi="' + esc(noteVi) + '">' + esc(noteEn) + '</p>'
      : '';

    return '<article class="newsrow">' +
             '<div class="dt">' + esc(fmtDate(item)) + '</div>' +
             '<div>' +
               '<h3>' + head + '</h3>' +
               '<div class="src">' + esc(item.source || '') + '</div>' +
               note +
             '</div>' +
             go +
           '</article>';
  }

  fetch('/news.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('news.json ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var items = (data && data.items) || [];
      if (!items.length) return;                  // keep the built-in list

      items = items.slice().sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date));
      });

      mount.innerHTML = items.map(row).join('');

      /* The page's own language switcher reads data-en and data-vi at call time,
         so re-applying the current language paints the new rows correctly. */
      var lang = document.documentElement.getAttribute('lang') || 'en';
      if (typeof window.setLang === 'function') window.setLang(lang);

      var stamp = document.getElementById('newsupdated');
      if (stamp && data.updated) {
        var d = new Date(data.updated);
        if (!isNaN(d)) {
          var t = (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate() + ' ' +
                  MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
          stamp.setAttribute('data-en', 'List updated ' + t);
          stamp.setAttribute('data-vi', 'Cập nhật ngày ' + t);
          stamp.textContent = (lang === 'vi' ? 'Cập nhật ngày ' : 'List updated ') + t;
        }
      }
    })
    .catch(function (e) {
      /* Silent by design: the HTML list is already on screen. */
      if (window.console) console.warn('news feed fallback in use:', e.message);
    });
})();
