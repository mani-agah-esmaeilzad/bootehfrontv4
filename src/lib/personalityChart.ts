// src/lib/personalityChart.ts

type AxisLike = {
  dimension?: string;
  dominantLetter?: string;
  dominantScore?: number;
};

type RadarLike = { subject: string; score: number; fullMark: number };

export const buildCompactRadarData = (analysis?: any): RadarLike[] => {
  if (analysis && Array.isArray(analysis.axes) && analysis.axes.length > 0) {
    return analysis.axes.map((axis: AxisLike) => {
      const subject = axis.dimension && axis.dominantLetter
        ? `${axis.dimension} (${axis.dominantLetter})`
        : axis.dimension || "بعد";
      return {
        subject,
        score: typeof axis.dominantScore === "number" ? axis.dominantScore : 0,
        fullMark: 100,
      };
    });
  }

  if (analysis && Array.isArray(analysis.radar) && analysis.radar.length > 0) {
    return analysis.radar;
  }

  return [];
};
