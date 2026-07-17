import React from 'react';

/**
 * Meridian Sidebar (desktop/tablet) — brand lockup, grouped nav items with
 * mint active rail, and a footer slot. Collapsible to a mini rail.
 */
export function Sidebar({ items = [], value, onChange, footer, brand = 'MERIDIAN', collapsed = false, style }) {
  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-w-mini)' : 'var(--sidebar-w)',
      flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--surface-sunken)', borderRight: '1px solid var(--border-subtle)',
      padding: '20px 12px', transition: 'width var(--dur-base) var(--ease-out)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px' }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--grad-brand)', flexShrink: 0 }} />
        {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{brand}</span>}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map(it => it.section ? (
          !collapsed && <div key={it.section} style={{ padding: '16px 10px 6px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{it.section}</div>
        ) : (
          <SideItem key={it.value} item={it} active={it.value === value} collapsed={collapsed} onClick={() => onChange && onChange(it.value)} />
        ))}
      </nav>
      {footer && <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>{footer}</div>}
    </aside>
  );
}

function SideItem({ item, active, collapsed, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
      height: 42, padding: collapsed ? 0 : '0 12px', justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', width: '100%',
      background: active ? 'var(--surface-card-raised)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
    }}>
      {active && <span style={{ position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 2, background: 'var(--brand)' }} />}
      <span style={{ display: 'flex', color: active ? 'var(--brand)' : 'inherit' }}>{item.icon}</span>
      {!collapsed && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active ? 600 : 500, flex: 1, textAlign: 'left' }}>{item.label}</span>}
      {!collapsed && item.badge}
    </button>
  );
}
