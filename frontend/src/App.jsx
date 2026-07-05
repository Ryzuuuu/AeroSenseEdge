import { useMemo, useState } from 'react';
import APUPanel from './components/APUPanel';
import AdvisoryFeed from './components/AdvisoryFeed';
import ExportButton from './components/ExportButton';
import FlightProfileChart from './components/FlightProfileChart';
import FuelBurnChart from './components/FuelBurnChart';
import MetricsStrip from './components/MetricsStrip';
import TopBar from './components/TopBar';
import useSimulation from './hooks/useSimulation';

function App() {
  const initialScenario = useMemo(() => ({
    route_distance_nm: 1200,
    cruise_altitude_ft: 34000,
    wind_seed: 42,
    aircraft_weight_t: 68,
    degraded_engine: false,
    turnaround_min: 30,
    departure_buffer_min: 10,
    ground_power_available: true,
  }), []);

  const {
    scenario,
    setScenario,
    metrics,
    tod,
    apu,
    advisories,
    status,
    loading,
    error,
    profileData,
    requestSimulation,
    requestApuAdvisory,
    exportCsv,
  } = useSimulation(initialScenario);

  const handleScenarioField = (field, value) => {
    setScenario((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="app-shell">
      <TopBar scenario={scenario} onScenarioChange={handleScenarioField} onRun={() => requestSimulation()} loading={loading} status={status} />

      <section className="controls-panel panel">
        <div className="controls">
          <label>Route distance (nm)
            <input type="number" value={scenario.route_distance_nm} onChange={(e) => handleScenarioField('route_distance_nm', Number(e.target.value))} />
          </label>
          <label>Altitude (ft)
            <input type="number" value={scenario.cruise_altitude_ft} onChange={(e) => handleScenarioField('cruise_altitude_ft', Number(e.target.value))} />
          </label>
          <label>Wind seed
            <input type="number" value={scenario.wind_seed} onChange={(e) => handleScenarioField('wind_seed', Number(e.target.value))} />
          </label>
          <label>Weight (t)
            <input type="number" value={scenario.aircraft_weight_t} onChange={(e) => handleScenarioField('aircraft_weight_t', Number(e.target.value))} />
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={scenario.degraded_engine} onChange={(e) => handleScenarioField('degraded_engine', e.target.checked)} />
            Degraded engine
          </label>
          <ExportButton loading={loading} onExport={() => exportCsv().catch(() => undefined)} />
        </div>
      </section>

      {error ? <div className="status-banner error">{error}</div> : <div className="status-banner">{status}</div>}

      <main className="dashboard-grid">
        <FlightProfileChart data={profileData} todDistanceNm={tod?.tod_distance_nm} />
        <AdvisoryFeed advisories={advisories} />
        <FuelBurnChart data={profileData} />
        <APUPanel apu={apu} scenario={scenario} onScenarioChange={handleScenarioField} onSubmit={requestApuAdvisory} />
        <MetricsStrip metrics={metrics} tod={tod} />
      </main>
    </div>
  );
}

export default App;
