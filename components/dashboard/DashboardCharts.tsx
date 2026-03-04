"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"

export function CancerDistribution({ data }: { data: any[] }) {
  return (
    <div className="h-75 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#8899AA" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#8899AA" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0A1628", border: "1px solid #00E5FF", borderRadius: "8px" }}
            itemStyle={{ color: "#00E5FF" }}
          />
          <Bar dataKey="count" fill="#00E5FF" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GeneRadar({ data }: { data: any[] }) {
  return (
    <div className="h-75 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#8899AA" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="gene" stroke="#8899AA" fontSize={12} />
          <Radar
            name="Importance"
            dataKey="importance"
            stroke="#8A2BE2"
            fill="#8A2BE2"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}