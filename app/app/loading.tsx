export default function Loading() {
  return (
    <main className="page-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loader-mark" aria-hidden="true">
        <span>C</span>
      </div>
      <p>Loading lesson…</p>
    </main>
  );
}
