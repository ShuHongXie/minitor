// 错误监控
export { ErrorBoundary, useErrorMonitor } from './error';
export type { ReactErrorMonitorOptions, ErrorBoundaryProps } from './error';

// Web Vitals 采集
export { useWebVitals } from './vitals';
export type { UseWebVitalsOptions } from './vitals';

// 从 core 中透传常用类型
export type { ErrorMonitorConfig, WebVitalsOptions, WebVitalsReportData } from '@minitrack/core';
