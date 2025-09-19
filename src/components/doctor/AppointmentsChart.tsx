
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { weeklyAppointments } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function AppointmentsChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={weeklyAppointments}>
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
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
            cursor={false}
            contentStyle={{ 
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
            }}
        />
        <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
