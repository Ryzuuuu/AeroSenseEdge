import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [scenario, setScenario] = useState({
    route_distance_nm: 1200,
    cruise_altitude_ft: 34000,
    wind_seed: 42,
    aircraft_weight_t: 68,
    degraded_engine: false,
  });
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [tod, setTod] = useState(null);
  const [apu, setApu] = useState(null);
  const [status, setStatus] = useState('Idle');

  const runSimulation = async () => {
    setStatus('Running simulation...');
    const response = await fetch(`${API_URL}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    });
    const data = await response.json();
    setRecords(data.records);
    setMetrics(data.metrics);
    setTod(data.tod);
    setApu(data.apu);
    setStatus('Simulation complete');
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const profileData = useMemo(() => records.slice(0, 120).map((row) => ({
    time: row.time_min,
    altitude: row.altitude_ft / 1000,
    speed: row.speed_kt,
    fuel: row.fuel_flow_kg_hr,
    predicted: row.predicted_fuel_flow_kg_hr,
  })), [records]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>AeroSense Edge • Virtual POC</h1>
          <p>Simulation mode — no live aircraft data or avionics bus integration</p>
        </div>
        <div className="controls">
          <label>Route distance (nm)
            <input type="number" value={scenario.route_distance_nm} onChange={(e) => setScenario({ ...scenario, route_distance_nm: Number(e.target.value) })} />
          </label>
          <label>Altitude (ft)
            <input type="number" value={scenario.cruise_altitude_ft} onChange={(e) => setScenario({ ...scenario, cruise_altitude_ft: Number(e.target.value) })} />
          </label>
          <label>Wind seed
            <input type="number" value={scenario.wind_seed} onChange={(e) => setScenario({ ...scenario, wind_seed: Number(e.target.value) })} />
          </label>
          <label>Weight (t)
            <input type="number" value={scenario.aircraft_weight_t} onChange={(e) => setScenario({ ...scenario, aircraft_weight_t: Number(e.target.value) })} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={scenario.degraded_engine} onChange={(e) => setScenario({ ...scenario, degraded_engine: e.target.checked })} />
            Degraded engine
          </label>
          <button onClick={runSimulation}>Run Simulation</button>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-header">
            <h2>Flight profile</h2>
            <span>{status}</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={profileData}>
              <CartesianGrid stroke="#23324a" />
              <XAxis dataKey="time" stroke="#9fb2c8" />
              <YAxis stroke="#9fb2c8" />
              <Tooltip />
              <Line type="monotone" dataKey="altitude" stroke="#f5a623" />
              <Line type="monotone" dataKey="speed" stroke="#4db6ac" />
              {tod ? <ReferenceLine x={tod.tod_distance_nm} stroke="#ff6b6b" /> : null}
            </LineChart>
          </ResponsiveContainer>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Advisory feed</h2>
          </div>
          <ul className="feed-list">
            <li>• Descend now for optimal idle descent</li>
            <li>• APU off in 4 min — ground power available</li>
            <li>• Fuel burn predictor tracking tail-specific degradation</li>
          </ul>
        </aside>

        <section className="panel wide">
          <div className="panel-header">
            <h2>Fuel burn: actual vs predicted</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={profileData}>
              <CartesianGrid stroke="#23324a" />
              <XAxis dataKey="time" stroke="#9fb2c8" />
              <YAxis stroke="#9fb2c8" />
              <Tooltip />
              <Line type="monotone" dataKey="fuel" stroke="#f5a623" name="OpenAP actual" />
              <Line type="monotone" dataKey="predicted" stroke="#4db6ac" name="Model prediction" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel bottom-strip">
          <div>
            <h3>Fuel saved</h3>
            <p>{tod ? `${tod.fuel_delta_kg} kg` : '—'}</p>
          </div>
          <div>
            <h3>CO2 avoided</h3>
            <p>{tod ? `${(tod.fuel_delta_kg * 3.16).toFixed(1)} kg` : '—'}</p>
          </div>
          <div>
            <h3>Prediction error</h3>
            <p>{metrics ? `${metrics.mape_pct.toFixed(1)}%` : '—'}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
