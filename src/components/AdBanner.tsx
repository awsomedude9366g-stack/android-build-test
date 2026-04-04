export default function AdBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 50,
        background: '#0A0918',
        borderTop: '1px solid rgba(139,92,246,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 9997,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'content-box',
      }}
    >
      <span style={{
        fontSize: 9, color: '#4B5563',
        border: '1px solid #2D2B5A', padding: '2px 6px', borderRadius: 3,
      }}>Ad</span>
      <span style={{ fontSize: 11, color: '#6B7280' }}>
        🚀 Upgrade to <span style={{ color: '#8B5CF6', fontWeight: 600 }}>AIdusk Pro</span> — No Limits
      </span>
      <span style={{
        fontSize: 9, color: '#4B5563',
        border: '1px solid #2D2B5A', padding: '2px 6px', borderRadius: 3,
      }}>Ad</span>
    </div>
  );
}
