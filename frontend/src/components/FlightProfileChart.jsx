import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function FlightProfileChart({ data, todDistanceNm }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Flight profile</p>
          <h2>Altitude and speed vs. time</h2>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid stroke="#23324a" vertical={false} />
          <XAxis dataKey="time" stroke="#9fb2c8" tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="#9fb2c8" tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="#9fb2c8" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#07111d', border: '1px solid #3e7cb1', borderRadius: 12 }} />
          <Line yAxisId="left" type="monotone" dataKey="altitude" stroke="#f2a93b" strokeWidth={2} dot={false} name="Altitude (kft)" />
          <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#4db6ac" strokeWidth={2} dot={false} name="Speed (kt)" />
          {todDistanceNm != null ? <ReferenceLine x={todDistanceNm} yAxisId="left" stroke="#ff6b6b" label="TOD" /> : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FlightProfileChart;
