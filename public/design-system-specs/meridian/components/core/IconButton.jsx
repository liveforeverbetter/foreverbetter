import React from 'react';

/** Meridian icon-only button — square/circular affordance for chrome actions. */
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  round = false,
  active = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const dims = { sm: 32, md: 40, lg: 48 }[size] || 40;
  const variants = {
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
    subtle: { background: 'var(--surface-card-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
    solid: { background: 'var(--brand)', color: 'var(--text-inverse)', border: '1px solid transparent' },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: dims, height: dims,
        borderRadius: round ? '50%' : 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        ...v,
        ...(active ? { color: 'var(--text-primary)', background: 'var(--surface-card-raised)' } : {}),
        ...(hover && !disabled ? { background: variant === 'solid' ? 'var(--brand-hover)' : 'var(--surface-card-hover)', color: variant === 'solid' ? 'var(--text-inverse)' : 'var(--text-primary)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
