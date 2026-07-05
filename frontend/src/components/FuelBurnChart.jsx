import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function FuelBurnChart({ data }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Fuel burn</p>
          <h2>Actual vs predicted fuel flow</h2>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid stroke="#23324a" vertical={false} />
          <XAxis dataKey="time" stroke="#9fb2c8" tickLine={false} axisLine={false} />
          <YAxis stroke="#9fb2c8" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#07111d', border: '1px solid #3e7cb1', borderRadius: 12 }} />
          <Line type="monotone" dataKey="fuel" stroke="#f2a93b" strokeWidth={2} dot={false} name="OpenAP actual" />
          <Line type="monotone" dataKey="predicted" stroke="#4db6ac" strokeWidth={2} dot={false} name="Model prediction" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FuelBurnChart;
