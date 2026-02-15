'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function RevenueChart({ data }: { data: Array<{ day: string; revenue: number }> }) {
  return (
    <div className="h-64 w-full rounded-xl bg-white p-4 dark:bg-slate-800">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Area dataKey="revenue" stroke="#008751" fill="#00875144" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
