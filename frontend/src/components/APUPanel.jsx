function APUPanel({ apu, scenario, onScenarioChange, onSubmit }) {
  return (
    <div className="panel apu-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">APU advisory</p>
          <h2>Ground power settings</h2>
        </div>
      </div>
      <label>
        Turnaround time (min)
        <input type="number" value={scenario.turnaround_min ?? 30} onChange={(e) => onScenarioChange('turnaround_min', Number(e.target.value))} />
      </label>
      <label>
        Departure buffer (min)
        <input type="number" value={scenario.departure_buffer_min ?? 10} onChange={(e) => onScenarioChange('departure_buffer_min', Number(e.target.value))} />
      </label>
      <label className="toggle-row">
        <input type="checkbox" checked={scenario.ground_power_available ?? true} onChange={(e) => onScenarioChange('ground_power_available', e.target.checked)} />
        Ground power available
      </label>
      <button className="secondary-button" onClick={onSubmit}>Refresh APU advisory</button>
      {apu ? <div className="apu-result"><p>{apu.reason}</p><span>{apu.apu_off_recommended ? `${apu.fuel_saved_kg.toFixed(1)} kg fuel saved` : 'No recommendation'}</span></div> : null}
    </div>
  );
}

export default APUPanel;
