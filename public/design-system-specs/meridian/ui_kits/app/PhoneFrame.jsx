// PhoneFrame — lightweight device shell for the Meridian app kit.
const PhoneFrame = ({ children, statusTime = '4:04' }) => {
  return (
    <div style={{
      width: 402, height: 844, borderRadius: 54, padding: 12,
      background: 'linear-gradient(160deg,#20262f,#0a0d12)',
      boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%', borderRadius: 43, overflow: 'hidden',
        background: 'var(--surface-page)', display: 'flex', flexDirection: 'column',
      }}>
        {/* status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 30px 4px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{statusTime}</span>
          <div style={{ position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)', width: 116, height: 30, background: '#000', borderRadius: 16 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
            <svg width="17" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1.5" width="3" height="10.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.4"/></svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.5c2.2 0 4.2.8 5.7 2.2l1.1-1.2A10 10 0 0 0 8 .8 10 10 0 0 0 1.2 3.5l1.1 1.2A8 8 0 0 1 8 2.5Z"/><path d="M8 6c1.2 0 2.3.5 3.1 1.2l1.1-1.1A6 6 0 0 0 8 4.3 6 6 0 0 0 3.8 6.1l1.1 1.1A4.5 4.5 0 0 1 8 6Z"/><circle cx="8" cy="10" r="1.6"/></svg>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12 }}>
              68<span style={{ width: 22, height: 12, border: '1.5px solid currentColor', borderRadius: 3, padding: 1.5, display: 'inline-flex', opacity: 0.9 }}><span style={{ width: '68%', background: 'currentColor', borderRadius: 1 }} /></span>
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
window.PhoneFrame = PhoneFrame;
