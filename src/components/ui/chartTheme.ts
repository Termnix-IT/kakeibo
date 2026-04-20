import type { CSSProperties } from 'react';

export const chartPalette = [
  '#2563eb',
  '#0891b2',
  '#059669',
  '#d97706',
  '#b91c1c',
  '#7c3aed',
];

export const chartColors = {
  primary: '#2563eb',
  income: '#1d4ed8',
  expense: '#b91c1c',
  success: '#047857',
  warning: '#b45309',
  grid: '#e2e8f0',
  axis: '#64748b',
};

export const chartTooltipStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: 12,
};

export const chartAxisTick = { fontSize: 11, fill: chartColors.axis };

export const chartLabelStyle: CSSProperties = {
  color: '#334155',
  fontWeight: 500,
};
