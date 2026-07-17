import React from 'react';

const sizes = {
  sm: { height: 32, padding: '0 12px', fontSize: 13, gap: 6, radius: 'var(--radius-sm)' },
  md: { height: 40, padding: '0 16px', fontSize: 14, gap: 8, radius: 'var(--radius-sm)' },
  lg: { height: 48, padding: '0 22px', fontSize: 15, gap: 8, radius: 'var(--radius-md)' },
};

const variants = {
  primary: { background: 'var(--brand)', color: 'var(--text-inverse)', border: '1px solid transparent' },
  secondary: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
  subtle: { background: 'var(--surface-card-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' },
  danger: { background: 'var(--red-500)', color: '#fff', border: '1px solid transparent' },
};

/**
 * Meridian primary action button. Mint-fill primary drives the single key action;
 * secondary/ghost/subtle recede; danger for destructive intent.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  block = false,
  disabled = false,
  loading = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  style,
  ...rest
}) {
  const sz = sizes[size] || sizes.md;
  const vr = variants[variant] || variants.primary;
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const hoverStyle = !disabled && hover ? (
    variant === 'primary' ? { background: 'var(--brand-hover)' }
    : variant === 'danger' ? { background: 'var(--red-400)' }
    : variant === 'secondary' ? { borderColor: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)' }
    : { background: 'var(--surface-card-hover)', color: 'var(--text-primary)' }
  ) : {};
  const activeStyle = !disabled && active && variant === 'primary' ? { background: 'var(--brand-press)' } : {};

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: sz.gap,
        height: sz.height,
        padding: sz.padding,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: sz.fontSize,
        letterSpacing: '0.005em',
        lineHeight: 1,
        borderRadius: pill ? 'var(--radius-pill)' : sz.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
        whiteSpace: 'nowrap',
        ...vr,
        ...hoverStyle,
        ...activeStyle,
        ...style,
      }}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(0,0,0,0.25)', borderTopColor: 'currentColor',
      display: 'inline-block', animation: 'mrd-spin 0.7s linear infinite',
    }} />
  );
}
