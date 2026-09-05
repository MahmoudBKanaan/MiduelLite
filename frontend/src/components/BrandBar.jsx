export default function BrandBar({ status = 'Live voice duels' }) {
  return (
    <header className="brand-bar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">M</span>
        <div>
          <div className="brand-name">Minduel Lite</div>
          <div className="brand-note">Ideas meet their match</div>
        </div>
      </div>
      <span className="status-pill">{status}</span>
    </header>
  );
}
