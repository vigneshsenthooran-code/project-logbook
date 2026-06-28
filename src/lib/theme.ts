// The app is dark-only. Theme/accent preferences and the Appearance tab were
// removed in the redesign; this just pins the document to the dark scheme so
// anything keying off data-theme keeps working.

export function applyTheme(): void {
  document.documentElement.dataset.theme = 'dark';
}
