// src/lib/chartSetup.ts
import { Chart as ChartJS, registerables } from "chart.js";

let isRegistered = false;

export const ensureChartSetup = () => {
  if (isRegistered) return;
  ChartJS.register(...registerables);
  ChartJS.defaults.font.family = "Vazir, Tahoma, sans-serif";
  ChartJS.defaults.font.size = 12;
  ChartJS.defaults.locale = "fa-IR";
  ChartJS.defaults.color = "#1f2937"; // slate-800
  isRegistered = true;
};

// Ensure setup runs immediately on first import.
ensureChartSetup();

export default ChartJS;
