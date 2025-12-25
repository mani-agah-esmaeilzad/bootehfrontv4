// src/components/charts/powerWheelTypes.ts

export type PowerWheelGroup =
  | "Teamwork"
  | "Communication"
  | "Cognitive Abilities"
  | "Work Ethic"
  | "Problem Solving"
  | "Leadership";

export interface PowerWheelAxis {
  key: string;
  label: string;
  group: PowerWheelGroup;
  value: number;
}

export const DEFAULT_POWER_WHEEL_COLORS: Record<PowerWheelGroup, string> = {
  Teamwork: "#6EE7B7",
  Communication: "#8B5CF6",
  "Cognitive Abilities": "#60A5FA",
  "Work Ethic": "#F59E0B",
  "Problem Solving": "#F472B6",
  Leadership: "#14B8A6",
};
