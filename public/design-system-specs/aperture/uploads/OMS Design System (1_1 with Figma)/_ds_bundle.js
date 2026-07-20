/* @ds-bundle: {"format":3,"namespace":"OMSDesignSystem11WithFigma_019de4","components":[],"sourceHashes":{"components/customer_profile.js":"8c9c2a5d51d2","components/sidebar.js":"88db0a759cf8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.OMSDesignSystem11WithFigma_019de4 = window.OMSDesignSystem11WithFigma_019de4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/customer_profile.js
try { (() => {
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
      try {
        window.lucide.createIcons();
      } catch (_) {}
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
    var text = (atom.getAttribute('data-copy') || label && label.textContent || '').trim();
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/customer_profile.js", error: String((e && e.message) || e) }); }

// components/sidebar.js
try { (() => {
/* ─────────────────────────────────────────────────────────────────
   OMS · Sidebar loader
   Fetches components/sidebar.html, mounts it into [data-oms-sidebar],
   wires up the Sandbox/Live toggle and the Settings expand/collapse,
   and applies the active item from window.__OMS_ACTIVE.
   ───────────────────────────────────────────────────────────────── */
(async () => {
  const mounts = document.querySelectorAll('[data-oms-sidebar]');
  if (!mounts.length) return;

  // Resolve the partial relative to THIS script so the same loader
  // works from /screens, /preview, or the project root.
  const here = document.currentScript && document.currentScript.src ? new URL(document.currentScript.src) : new URL(location.href);
  const partialUrl = new URL('./sidebar.html?v=18', here).href;
  let html;
  try {
    html = await fetch(partialUrl).then(r => r.text());
  } catch (e) {
    console.error('[oms-sidebar] failed to load', partialUrl, e);
    return;
  }
  mounts.forEach(mount => {
    mount.innerHTML = html;

    // Rewrite the logo's relative ../assets/ path so it resolves from
    // whatever folder the host page lives in.
    const logo = mount.querySelector('.oms-sidebar__logo');
    if (logo) {
      const rel = mount.getAttribute('data-assets-base') || '../assets';
      logo.setAttribute('src', rel.replace(/\/$/, '') + '/logo_polygon_oms_stacked.svg');
    }

    // Active item
    const activeKey = window.__OMS_ACTIVE || mount.getAttribute('data-active');
    if (activeKey) {
      mount.querySelectorAll('.oms-sb-item').forEach(el => {
        if (el.getAttribute('data-key') === activeKey) el.classList.add('is-selected');else el.classList.remove('is-selected');
      });
    }

    // Sandbox / Live segmented (uses canonical Mode Toggle component)
    mount.querySelectorAll('[data-oms-mode-toggle]').forEach(toggle => {
      toggle.addEventListener('click', e => {
        const opt = e.target.closest('.oms-mode-toggle__opt');
        if (!opt) return;
        const opts = toggle.querySelectorAll('.oms-mode-toggle__opt');
        opts.forEach(o => {
          o.classList.remove('is-active');
          o.setAttribute('aria-selected', 'false');
        });
        opt.classList.add('is-active');
        opt.setAttribute('aria-selected', 'true');
        const liveActive = opts[1] && opts[1].classList.contains('is-active');
        toggle.classList.toggle('oms-mode-toggle--live', liveActive);
      });
    });

    // Settings expand/collapse
    const settings = mount.querySelector('button.oms-sb-item[data-key="Settings"]');
    if (settings) {
      const children = settings.parentElement.querySelector('.oms-sb-children');
      settings.addEventListener('click', () => {
        const open = settings.classList.toggle('is-open');
        if (children) children.style.display = open ? '' : 'none';
        settings.setAttribute('aria-expanded', String(open));
      });
    }
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sidebar.js", error: String((e && e.message) || e) }); }

})();
