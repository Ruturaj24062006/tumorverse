"use client"

import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card } from "./card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

interface Gene {
  gene: string
  importance: number
}

interface GeneVisualizerProps {
  genes: Gene[]
  title?: string
}

export function GeneVisualizer({ genes, title = "Gene Importance Analysis" }: GeneVisualizerProps) {
  // Prepare data for bar chart
  const barData = genes.slice(0, 8).map((g) => ({
    name: g.gene.length > 8 ? g.gene.substring(0, 8) + "." : g.gene,
    fullName: g.gene,
    value: Math.round(g.importance * 100),
  }))

  // Prepare data for radar chart
  const radarData = genes.slice(0, 6).map((g) => ({
    subject: g.gene,
    value: Math.round(g.importance * 100),
    fullMark: 100,
  }))

  const colors = ["#00E5FF", "#00FF9C", "#FF9F43", "#8A2BE2", "#FF3B5C", "#00E5FF"]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="rounded bg-black/80 p-2 text-xs text-white border border-gray-700">
          <p>{payload[0].payload.fullName || payload[0].payload.subject}</p>
          <p className="text-[#00E5FF]">Importance: {payload[0].value}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-0 bg-black/40 p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#E8EDF2]">{title}</h3>

      <Tabs defaultValue="bar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border-b border-gray-700">
          <TabsTrigger
            value="bar"
            className="data-[state=active]:text-[#00E5FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00E5FF]"
          >
            Top Genes
          </TabsTrigger>
          <TabsTrigger
            value="radar"
            className="data-[state=active]:text-[#00E5FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00E5FF]"
          >
            Radar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bar" className="mt-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136, 153, 170, 0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#8899AA"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#8899AA"
                  style={{ fontSize: "12px" }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#00E5FF">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="radar" className="mt-4">
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(136, 153, 170, 0.2)" />
                <PolarAngleAxis dataKey="subject" stroke="#8899AA" style={{ fontSize: "12px" }} />
                <PolarRadiusAxis stroke="#8899AA" angle={90} domain={[0, 100]} />
                <Radar
                  name="Importance"
                  dataKey="value"
                  stroke="#00E5FF"
                  fill="#00E5FF"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 grid gap-2 text-xs text-gray-400">
        <p className="font-semibold text-[#E8EDF2]">Top 3 Significant Genes:</p>
        {genes.slice(0, 3).map((gene, index) => (
          <div key={index} className="flex items-center justify-between">
            <span>{gene.gene}</span>
            <span className="text-[#00E5FF]">{Math.round(gene.importance * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
