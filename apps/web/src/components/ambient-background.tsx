export function AmbientBackground({ subtle = false }: { subtle?: boolean }) {
  return (
    <div aria-hidden="true" className={subtle ? 'ambient ambient-subtle' : 'ambient'}>
      <div className="ambient-base" />
      <div className="ambient-noise" />
      <div className="ambient-grid" />
      <div className="ambient-blobs">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
        <div className="ambient-blob ambient-blob-4" />
      </div>
    </div>
  );
}
