/* ─────────────────────────────────────────────────────────────────
   OMS Design System — Customer profile · click-to-copy behaviour
   Click any `.oms-cp-atom[data-copyable]` to:
     • write `data-copy` (or visible label text) to the clipboard
     • flip the atom to `data-state="clicked"` (the "Copied" pill)
     • swap the inner copy icon to a check
     • revert after 3 s
   Works on both desktop and mobile.
   ───────────────────────────────────────────────────────────────── */
(function () {
  var REVERT_MS = 3000;

  function setLucideIcon(host, name) {
    if (!host) return;
    host.innerHTML = '<i data-lucide="' + name + '"></i>';
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (_) {}
    }
  }

  function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
      return;
    }
    // Fallback for older browsers / non-secure contexts.
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (_) {}
  }

  document.addEventListener('click', function (e) {
    var atom = e.target.closest && e.target.closest('.oms-cp-atom[data-copyable]');
    if (!atom) return;
    // Already in clicked state — ignore re-clicks during the 3 s window.
    if (atom.getAttribute('data-state') === 'clicked') return;

    var label = atom.querySelector('.oms-cp-atom__label');
    var text  = (atom.getAttribute('data-copy') ||
                 (label && label.textContent) || '').trim();
    copyText(text);

    var copyHost = atom.querySelector('.oms-cp-atom__copy');
    setLucideIcon(copyHost, 'circle-check-big');
    atom.setAttribute('data-state', 'clicked');

    if (atom._cpCopyTimer) clearTimeout(atom._cpCopyTimer);
    atom._cpCopyTimer = setTimeout(function () {
      atom.removeAttribute('data-state');
      setLucideIcon(copyHost, 'copy');
      atom._cpCopyTimer = null;
    }, REVERT_MS);
  });
})();
