"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"

type DailyData = {
  day: number
  amount: number
}

type CategoryData = {
  name: string
  value: number
  color: string
}

type MonthlyData = {
  month: string
  amount: number
}

export function DailySpendingChart({ data }: { data: DailyData[] }) {
  const [chartHeight, setChartHeight] = useState(300)
  const [fontSize, setFontSize] = useState(12)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setChartHeight(250)
        setFontSize(10)
      } else {
        setChartHeight(300)
        setFontSize(12)
      }
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

return (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis
        dataKey="day"
        className="text-xs"
        tick={{ fill: "currentColor", fontSize: 11 }}
      />
      <YAxis className="text-xs" tick={{ fill: "currentColor", fontSize: 11 }} />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          fontSize: "12px",
        }}
        labelStyle={{ color: "#374151", fontWeight: "600", marginBottom: "4px" }}
        formatter={(value) =>
          [`₱${Number(value).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`, "Amount"]
        }
      />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const [chartHeight, setChartHeight] = useState(300)
  const [outerRadius, setOuterRadius] = useState(90)
  const [innerRadius, setInnerRadius] = useState(40)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setChartHeight(280)
        setOuterRadius(70)
        setInnerRadius(35)
        setIsMobile(true)
      } else {
        setChartHeight(300)
        setOuterRadius(90)
        setInnerRadius(40)
        setIsMobile(false)
      }
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // PowerBI-style color palette
  const POWERBI_COLORS = [
    "#00B7C3", // Teal
    "#5F6B6D", // Gray
    "#FDB462", // Orange
    "#B3DE69", // Light Green
    "#FCCDE5", // Pink
    "#D9D9D9", // Light Gray
    "#BC80BD", // Purple
    "#CCEBC5", // Mint
    "#FFED6F", // Yellow
    "#8DD3C7", // Aqua
    "#FB8072", // Red
    "#80B1D3", // Blue
  ]

  // Use category colors if available, otherwise use PowerBI palette
  const dataWithColors = data.map((entry, index) => ({
    ...entry,
    color: entry.color !== "#888888" ? entry.color : POWERBI_COLORS[index % POWERBI_COLORS.length]
  }))

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <PieChart>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          labelLine={{
            stroke: "#6b7280",
            strokeWidth: 1,
          }}
          label={({ name, percent }) => {
            if ((percent || 0) < 0.05) return null // Hide labels for slices < 5%
            if (isMobile) {
              return `${((percent || 0) * 100).toFixed(0)}%` // Only show percentage on mobile
            }
            return `${name}: ${((percent || 0) * 100).toFixed(0)}%`
          }}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          paddingAngle={2}
          dataKey="value"
          stroke="#ffffff"
          strokeWidth={2}
        >
          {dataWithColors.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              style={{
                filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))",
              }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            padding: "12px",
          }}
          itemStyle={{ color: "#374151", fontWeight: "500" }}
          formatter={(value) =>
            `₱${Number(value).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          }
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          formatter={(value) => value}
          wrapperStyle={{
            paddingTop: "20px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlySpendingChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          className="text-xs"
          tick={{ fill: "currentColor", fontSize: 11 }}
        />
        <YAxis className="text-xs" tick={{ fill: "currentColor", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#374151", fontWeight: "600", marginBottom: "4px" }}
          cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
          formatter={(value) =>
            [`₱${Number(value).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`, "Spending"]
          }
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
