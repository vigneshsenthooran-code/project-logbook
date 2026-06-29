export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <svg className="loading-mark" width={84} height={84} viewBox="0 0 100 100" aria-hidden>
        <rect className="loading-stroke" x="29" y="18" width="46" height="60" rx="6" pathLength={1} style={{ animationDelay: '0s' }} />
        <rect className="loading-stroke" x="16" y="12" width="46" height="60" rx="6" pathLength={1} style={{ animationDelay: '1.5s' }} />
      </svg>
      <h1 className="loading-title">
        <span className="loading-line">CAPTURE THE</span>
        <span className="loading-line">
          <span className="serif-accent">work,</span> FILE THE
        </span>
        <span className="loading-line">
          <span className="serif-accent">thinking.</span>
        </span>
      </h1>
    </div>
  );
}
