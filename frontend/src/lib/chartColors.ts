// Shared chart palette so all dashboards stay visually consistent.
// Named colors for single-series accents; CHART_SERIES for multi-series charts.

export const CHART_COLORS = {
    blue: '#2563eb',
    green: '#16a34a',
    amber: '#f59e0b',
    red: '#dc2626',
    purple: '#7c3aed',
    slate: '#64748b',
    sky: '#0ea5e9',
    indigo: '#6366f1',
    cyan: '#0891b2',
    pink: '#db2777',
    lime: '#65a30d',
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
    labelStrong: '#111827',
    trackLight: '#e2e8f0',
    trackMuted: '#cbd5e1',
} as const;
