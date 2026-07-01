import { Link } from 'react-router-dom';
import DecorMark from './DecorMark';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <DecorMark className="site-footer-mark" size={22} />
          <div>
            <div className="site-footer-name">Quire</div>
            <p className="t-caption-sm muted">A private logbook for design work — synced or local, your call.</p>
          </div>
        </div>

        <nav className="site-footer-links">
          <Link to="/">Dashboard</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/settings">Settings</Link>
        </nav>

        <p className="t-caption-sm muted site-footer-copy">© {year} Quire. Built for the UTS Architecture design log.</p>
      </div>
    </footer>
  );
}
