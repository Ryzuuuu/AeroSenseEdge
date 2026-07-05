function MetricsStrip({ metrics, tod }) {
  const fuelSaved = tod?.fuel_delta_kg ?? 0;
  const co2Saved = tod?.co2_delta_kg ?? 0;
  const predictionError = metrics?.mape_pct ?? 0;

  return (
    <section className="panel bottom-strip">
      <div className="metric-card">
        <p className="panel-eyebrow">Fuel saved</p>
        <h3>{fuelSaved.toFixed(1)} kg</h3>
        <span>vs. late descent baseline</span>
      </div>
      <div className="metric-card">
        <p className="panel-eyebrow">CO2 avoided</p>
        <h3>{co2Saved.toFixed(1)} kg</h3>
        <span>from the TOD optimization</span>
      </div>
      <div className="metric-card">
        <p className="panel-eyebrow">Prediction error</p>
        <h3>{predictionError.toFixed(1)}%</h3>
        <span>Held-out MAPE from the live model</span>
      </div>
    </section>
  );
}

export default MetricsStrip;
