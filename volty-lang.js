/* =====================================================================
   Volty language switch. One implementation, loaded by every page.
   ---------------------------------------------------------------------
   Why this file exists:
   The site had shipped two incompatible switchers. Pages built first
   (index, design) defined setLang() and swapped textContent from
   data-en / data-vi. Pages built later (u1, audience, contact, both
   economics pages) defined __setLang(), swapped innerHTML from data-vi,
   walked the text nodes against a __VI_LABELS dictionary, and wrote the
   choice to localStorage. The first group neither wrote nor read that
   key, so a reader who chose VI and then opened Home or Our Design was
   silently put back into English, and a reader who chose VI on those two
   pages lost the choice on the next click. That is the reported fault.

   Rules this file keeps:
   - Both names are exported. Any inline onclick left in older markup
     still works, whichever name it calls.
   - The control is bound by delegation and calls preventDefault and
     stopPropagation, so a language button can never navigate, submit,
     or bubble into a parent link.
   - The choice is written to localStorage on every switch and restored
     on every page load, before first paint of the body content.
   - __VI_LABELS is optional. A page without one still translates every
     data-vi element; the dictionary only adds the loose text nodes.
   - English is restored from a snapshot of the live markup, not from
     data-en, so nested links and <em> survive a round trip.
   ===================================================================== */
(function () {
  var KEY = 'voltyLang';
  var titleEn = null;

  function dict() {
    return (typeof window.__VI_LABELS !== 'undefined' && window.__VI_LABELS) ? window.__VI_LABELS : null;
  }

  function apply(lang) {
    lang = (lang === 'vi') ? 'vi' : 'en';
    var D = dict();

    /* Snapshot English markup BEFORE the text-node pass can rewrite it.
       Without this, an element whose English text is also a dictionary key
       gets its "English" copy saved already translated, and switching back
       leaves Vietnamese on the page. */
    document.querySelectorAll('[data-vi]').forEach(function (el) {
      if (el.__enHtml === undefined) el.__enHtml = el.innerHTML;
    });

    if (D) {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n;
      while ((n = w.nextNode())) {
        var raw = n.nodeValue, k = raw.trim();
        if (!k) continue;
        if (lang === 'vi') {
          var vi = D[k];
          if (vi) { if (n.__en === undefined) n.__en = raw; n.nodeValue = raw.replace(k, vi); }
        } else if (n.__en !== undefined) {
          n.nodeValue = n.__en;
        }
      }
    }

    document.querySelectorAll('[data-vi]').forEach(function (el) {
      if (lang === 'vi') { el.innerHTML = el.getAttribute('data-vi'); }
      else if (el.__enHtml !== undefined) { el.innerHTML = el.__enHtml; }
    });

    document.querySelectorAll('[data-ph-' + lang + ']').forEach(function (el) {
      el.placeholder = el.getAttribute('data-ph-' + lang);
    });

    if (titleEn === null) titleEn = document.title;
    document.title = (lang === 'vi' && D && D[titleEn]) ? D[titleEn] : titleEn;

    document.documentElement.lang = lang;

    document.querySelectorAll('.langsw .lb, .langsw button[data-l]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-l') === lang);
    });

    try { localStorage.setItem(KEY, lang); } catch (e) {}

    /* Content drawn by script rather than markup: the swap simulator, the
       mode configurator, and anything a page registers itself. Each is
       optional and each failure is contained. */
    ['__swapRerender', '__modeRerender', '__viHook'].forEach(function (h) {
      if (typeof window[h] === 'function') { try { window[h](lang); } catch (e) {} }
    });
  }

  window.setLang = apply;
  window.__setLang = apply;

  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var b = t.closest('.langsw .lb, .langsw button[data-l]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      apply(b.getAttribute('data-l'));
    }, true);

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved === 'vi' ? 'vi' : 'en');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
