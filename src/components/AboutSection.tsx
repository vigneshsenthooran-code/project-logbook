export default function AboutSection() {
  return (
    <section className="settings-section">
      <h2 className="t-display-sm">About</h2>
      <div className="settings-rows">
        <div className="settings-row">
          <span className="settings-row-label">App</span>
          <span className="settings-row-value">Quire — Project Logbook</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Version</span>
          <span className="settings-row-value">1.0.0</span>
        </div>
      </div>
      <p className="t-body-sm muted">
        A capture-first logbook that files notes, images, files and links into the categories that fit your project —
        from architecture studio work to research and beyond.
      </p>
    </section>
  );
}
