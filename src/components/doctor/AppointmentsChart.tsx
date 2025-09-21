
'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ChartData {
  day: string;
  appointments: number;
}

interface AppointmentsChartProps {
  data: ChartData[];
}

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.5)" />
        <XAxis
          dataKey="day"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={value => `${value}`}
          allowDecimals={false}
        />
        <Tooltip
          cursor={false}
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Bar
          dataKey="appointments"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
