import React from 'react';

/** Meridian CodeInput — segmented one-time-code / verification entry. */
export function CodeInput({ length = 6, value = '', onChange, error = false, style }) {
  const refs = React.useRef([]);
  const chars = value.split('').slice(0, length);
  const [focusIdx, setFocusIdx] = React.useState(-1);
  const setChar = (i, ch) => {
    const next = value.split('');
    next[i] = ch;
    const joined = next.join('').slice(0, length);
    onChange && onChange(joined);
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  };
  return (
    <div style={{ display: 'flex', gap: 10, ...style }}>
      {Array.from({ length }).map((_, i) => {
        const active = focusIdx === i;
        return (
          <input
            key={i}
            ref={el => (refs.current[i] = el)}
            inputMode="numeric" maxLength={1} value={chars[i] || ''}
            onFocus={() => setFocusIdx(i)} onBlur={() => setFocusIdx(-1)}
            onChange={e => setChar(i, e.target.value.replace(/\D/g, '').slice(-1))}
            onKeyDown={e => { if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus(); }}
            style={{
              width: 48, height: 56, textAlign: 'center',
              background: 'var(--surface-input)',
              border: `1px solid ${error ? 'var(--red-500)' : active ? 'var(--brand)' : 'var(--border-default)'}`,
              boxShadow: active && !error ? '0 0 0 3px var(--focus-ring)' : 'none',
              borderRadius: 'var(--radius-md)', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 22,
              transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
            }}
          />
        );
      })}
    </div>
  );
}
