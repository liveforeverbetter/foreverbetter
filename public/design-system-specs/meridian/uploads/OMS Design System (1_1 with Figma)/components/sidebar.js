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
  const here = document.currentScript && document.currentScript.src
    ? new URL(document.currentScript.src)
    : new URL(location.href);
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
        if (el.getAttribute('data-key') === activeKey) el.classList.add('is-selected');
        else el.classList.remove('is-selected');
      });
    }

    // Sandbox / Live segmented (uses canonical Mode Toggle component)
    mount.querySelectorAll('[data-oms-mode-toggle]').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
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
