import React from 'react';
import { MenuItem } from '../navigation/MenuItem.jsx';

/** Meridian ContextMenu — floating menu surface. Pass items or MenuItem children. */
export function ContextMenu({ items, children, width = 220, style }) {
  return (
    <div role="menu" style={{
      width, padding: 6, background: 'var(--surface-overlay)',
      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-raised)', animation: 'mrd-scale-in var(--dur-fast) var(--ease-out)', transformOrigin: 'top', ...style,
    }}>
      {items ? items.map((it, i) => it.separator
        ? <div key={i} style={{ height: 1, background: 'var(--divider)', margin: '6px 4px' }} />
        : <MenuItem key={i} {...it} />
      ) : children}
    </div>
  );
}
