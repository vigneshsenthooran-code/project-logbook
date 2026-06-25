import StorageSection from '../components/StorageSection';

export default function Settings() {
  return (
    <div className="settings">
      <header className="view-head">
        <h1 className="t-display-xl">Settings</h1>
        <p className="muted">Manage where your logbook lives.</p>
      </header>

      <StorageSection />
    </div>
  );
}
