import type { CSSProperties } from 'react';

export const chartPalette = [
  '#22d3ee',
  '#ec4899',
  '#10e0a0',
  '#a855f7',
  '#fb923c',
  '#facc15',
  '#3b82f6',
  '#f472b6',
];

export const chartColors = {
  primary: '#22d3ee',
  income: '#22d3ee',
  expense: '#ec4899',
  balance: '#3b82f6',
  success: '#10e0a0',
  warning: '#fb923c',
  grid: '#1f2842',
  axis: '#5a6280',
};

export const chartTooltipStyle: CSSProperties = {
  border: '1px solid rgba(34, 211, 238, 0.4)',
  borderRadius: 8,
  backgroundColor: '#0d1224',
  boxShadow: '0 0 18px rgba(34, 211, 238, 0.2), 0 8px 24px rgba(0, 0, 0, 0.5)',
  fontSize: 12,
  color: '#e7eaf3',
};

export const chartAxisTick = { fontSize: 11, fill: chartColors.axis };

export const chartLabelStyle: CSSProperties = {
  color: '#e7eaf3',
  fontWeight: 500,
};
