export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
      <div
        aria-label="Loading"
        style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-brand)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}
