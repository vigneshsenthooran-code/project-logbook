import AccountSection from '../components/AccountSection';
import StorageSection from '../components/StorageSection';
import DataSection from '../components/DataSection';
import AboutSection from '../components/AboutSection';

export default function Settings() {
  return (
    <div className="settings">
      <header className="view-head">
        <h1 className="t-display-xl">Settings</h1>
        <p className="muted">Manage your account, data and storage.</p>
      </header>

      <AccountSection />
      <StorageSection />
      <DataSection />
      <AboutSection />
    </div>
  );
}
