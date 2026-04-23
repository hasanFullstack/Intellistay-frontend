import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function OwnerPerformanceChart({ months = [], revenueValues = [], occupancyValues = [], metric = "revenue" }) {
  const data = useMemo(() => {
    if (metric === "occupancy") {
      return {
        labels: months.map((m) => m.label),
        datasets: [
          {
            label: "Occupancy (%)",
            data: occupancyValues,
            backgroundColor: "rgba(16,185,129,0.9)",
            borderRadius: 6,
            barThickness: 24,
          },
        ],
      };
    }

    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: "Revenue (Rs)",
          data: revenueValues,
          backgroundColor: "rgba(37,99,235,0.95)",
          borderRadius: 6,
          barThickness: 24,
        },
      ],
    };
  }, [months, revenueValues, occupancyValues, metric]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: { enabled: true, mode: "index", intersect: false },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { drawBorder: false, color: "#f1f5f9" },
        ticks: {
          callback: function (value) {
            if (metric === "revenue") return `Rs ${Number(value).toLocaleString()}`;
            return `${value}%`;
          },
        },
        suggestedMax: metric === "occupancy" ? 100 : undefined,
      },
    },
  }), [metric]);

  return (
    <div style={{ height: 300 }} className="w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
