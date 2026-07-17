import React from 'react';

/**
 * Meridian Icon — thin wrapper around Lucide (the system's icon set).
 * Requires the Lucide UMD script on the page:
 *   <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
 * Renders inline SVG that inherits `currentColor` and a 1.75 stroke.
 */
export function Icon({ name, size = 20, strokeWidth = 1.75, color = 'currentColor', style, ...rest }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const holder = document.createElement('i');
    holder.setAttribute('data-lucide', name);
    el.appendChild(holder);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({
        nameAttr: 'data-lucide',
        attrs: { width: size, height: size, 'stroke-width': strokeWidth },
      });
    }
  }, [name, size, strokeWidth]);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color, flexShrink: 0, ...style }}
      {...rest}
    />
  );
}
