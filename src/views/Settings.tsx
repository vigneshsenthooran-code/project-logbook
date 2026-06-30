import AccountSection from '../components/AccountSection';
import StorageSection from '../components/StorageSection';
import PresetsSection from '../components/PresetsSection';
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
      <PresetsSection />
      <DataSection />
      <AboutSection />
    </div>
  );
}
