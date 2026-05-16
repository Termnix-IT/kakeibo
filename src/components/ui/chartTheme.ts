import type { CSSProperties } from 'react';

export const chartPalette = [
  '#4a7c59', // sage
  '#b45838', // terracotta
  '#5fa371', // fresh green
  '#87a878', // moss
  '#c98a3a', // amber
  '#b8a040', // mustard
  '#3d8071', // teal-green
  '#6b9b76', // mint
];

export const chartColors = {
  primary: '#4a7c59',
  income: '#4a7c59',
  expense: '#b45838',
  balance: '#3d8071',
  success: '#5fa371',
  warning: '#c98a3a',
  grid: '#e5e7e0',
  axis: '#9ca3a0',
};

export const chartTooltipStyle: CSSProperties = {
  border: '1px solid rgba(74, 124, 89, 0.35)',
  borderRadius: 8,
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 16px rgba(17, 24, 39, 0.08)',
  fontSize: 12,
  color: '#1f2937',
};

export const chartAxisTick = { fontSize: 11, fill: chartColors.axis };

export const chartLabelStyle: CSSProperties = {
  color: '#1f2937',
  fontWeight: 500,
};
