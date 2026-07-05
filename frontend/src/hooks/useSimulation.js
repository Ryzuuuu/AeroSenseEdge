import { useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function useSimulation(initialScenario) {
  const [scenario, setScenario] = useState(initialScenario);
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [tod, setTod] = useState(null);
  const [apu, setApu] = useState(null);
  const [advisories, setAdvisories] = useState([]);
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const profileData = useMemo(() => records.slice(0, 120).map((row) => ({
    time: row.time_min,
    altitude: row.altitude_ft / 1000,
    speed: row.speed_kt,
    fuel: row.fuel_flow_kg_hr,
    predicted: row.predicted_fuel_flow_kg_hr,
  })), [records]);

  const requestSimulation = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError(null);
    setStatus('Running simulation...');

    try {
      const body = { ...scenario, ...overrides };
      const response = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(detail.detail || 'Request failed');
      }
      const data = await response.json();
      setRecords(data.records || []);
      setMetrics(data.metrics || null);
      setTod(data.tod || null);
      setApu(data.apu || null);
      setAdvisories(data.advisories || []);
      setStatus('Simulation complete');
      return data;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setStatus('Simulation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const requestApuAdvisory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arrival_time_min: scenario.turnaround_min ?? 30,
          expected_departure_min: scenario.departure_buffer_min ?? 10,
          ground_power_available: scenario.ground_power_available ?? true,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to refresh APU advisory');
      }
      const data = await response.json();
      setApu(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to refresh APU advisory');
      return null;
    }
  }, [scenario.ground_power_available, scenario.turnaround_min, scenario.departure_buffer_min]);

  const exportCsv = useCallback(async () => {
    const response = await fetch(`${API_URL}/export-csv`);
    if (!response.ok) {
      throw new Error('CSV export failed');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aerosense_compliance.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    requestSimulation();
  }, []);

  return {
    scenario,
    setScenario,
    records,
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
  };
}

export default useSimulation;
