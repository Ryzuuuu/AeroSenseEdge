function ExportButton({ loading, onExport }) {
  return (
    <button className="export-button" onClick={onExport} disabled={loading}>
      {loading ? 'Preparing CSV…' : 'Export CSV'}
    </button>
  );
}

export default ExportButton;
