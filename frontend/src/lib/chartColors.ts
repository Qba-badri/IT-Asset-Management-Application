// Shared chart palette so all dashboards stay visually consistent.
// Colors follow the Tabler design language (https://github.com/tabler/tabler).
// Named colors for single-series accents; CHART_SERIES for multi-series charts.

export const CHART_COLORS = {
    blue: '#066fd1',
    green: '#2fb344',
    amber: '#f59f00',
    red: '#d63939',
    purple: '#ae3ec9',
    slate: '#667382',
    sky: '#4299e1',
    indigo: '#4263eb',
    cyan: '#17a2b8',
    pink: '#d6336c',
    lime: '#74b816',
} as const;

export const CHART_SERIES: string[] = [
    CHART_COLORS.blue,
    CHART_COLORS.green,
    CHART_COLORS.amber,
    CHART_COLORS.red,
    CHART_COLORS.purple,
    CHART_COLORS.cyan,
    CHART_COLORS.pink,
    CHART_COLORS.lime,
];

// Neutral tones used for axis labels, grid lines, and donut center text.
export const CHART_NEUTRALS = {
    axisLabel: '#9ca3af',
    gridLine: '#f1f5f9',
    labelMuted: '#6b7280',
    labelStrong: '#1f2937',
    trackLight: '#e5e7eb',
    trackMuted: '#cbd5e1',
} as const;
