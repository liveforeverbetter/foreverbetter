// LoginScreen — brand entry / sign-in.
const LoginScreen = ({ onEnter }) => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { Button, Input, Icon } = M;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,#0b1a14 20%,rgba(18,217,130,0.45) 60%,transparent 78%)', filter: 'blur(6px)' }} />
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <svg width="44" height="44" viewBox="0 0 120 120" fill="none" style={{ color: 'var(--text-primary)' }}>
            <circle cx="60" cy="60" r="46" stroke="currentColor" strokeOpacity="0.18" strokeWidth="8" />
            <path d="M60 14 a46 46 0 0 1 40.6 68.4" stroke="url(#lg)" strokeWidth="8" strokeLinecap="round" />
            <circle cx="60" cy="60" r="24" stroke="currentColor" strokeOpacity="0.18" strokeWidth="8" />
            <path d="M60 36 a24 24 0 0 1 12 44.8" stroke="url(#lg)" strokeWidth="8" strokeLinecap="round" />
            <defs><linearGradient id="lg" x1="20" y1="14" x2="104" y2="106" gradientUnits="userSpaceOnUse"><stop stopColor="#12D982" /><stop offset="1" stopColor="#0E9DE8" /></linearGradient></defs>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-1.2px', color: 'var(--text-primary)' }}>MERIDIAN</span>
        </div>
        <h1 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, lineHeight: 0.98, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>Know your body.<br />Move your baseline.</h1>
        <p style={{ margin: '0 0 32px', fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.4, color: 'var(--text-secondary)' }}>24/7 insight across sleep, strain, stress and heart health — with coaching that starts day one.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="you@email.com" iconLeft={<Icon name="mail" size={16} />} />
          <Button block size="lg" onClick={onEnter}>Continue</Button>
          <Button block size="lg" variant="secondary" iconLeft={<Icon name="fingerprint" size={18} />} onClick={onEnter}>Sign in with passkey</Button>
        </div>
      </div>
      <p style={{ position: 'relative', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)', paddingBottom: 24 }}>By continuing you agree to our Terms & Privacy.</p>
    </div>
  );
};
window.LoginScreen = LoginScreen;
