import React from 'react';
import { initVitalsCollection, currentPage, resetReportedMetrics } from '@minitrack/core';
import type { WebVitalsOptions } from '@minitrack/core';

// ===================== 类型定义 =====================

export interface UseWebVitalsOptions extends WebVitalsOptions {
  /** 是否启用（默认 true） */
  enabled?: boolean;
}

// ===================== useWebVitals Hook =====================

/**
 * Web Vitals 指标采集 Hook
 * 在组件挂载时自动开始采集，路由变化时重新采集
 *
 * @example
 * ```tsx
 * // 基础用法（不集成路由）
 * function App() {
 *   useWebVitals({
 *     projectName: 'my-app',
 *     buildVersion: '1.0.0',
 *   })
 *   return <div>...</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 配合 react-router 使用
 * function App() {
 *   const location = useLocation()
 *   useWebVitals({
 *     projectName: 'my-app',
 *     buildVersion: '1.0.0',
 *   }, location.pathname)
 *   return <Outlet />
 * }
 * ```
 */
export function useWebVitals(options: UseWebVitalsOptions, pathname?: string) {
  const { enabled = true, ...vitalsOptions } = options;

  // 首屏采集
  React.useEffect(() => {
    if (!enabled) return;

    const initFirstLoad = () => {
      console.log('Initiating first load metrics collection');
      initVitalsCollection(vitalsOptions);
    };

    if (document.readyState === 'complete') {
      initFirstLoad();
    } else {
      window.addEventListener('load', initFirstLoad);
      return () => window.removeEventListener('load', initFirstLoad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 路由切换时重新采集
  React.useEffect(() => {
    if (!enabled || pathname === undefined) return;

    // 跳过首次渲染（首屏采集已处理）
    const timer = setTimeout(() => {
      currentPage.path = pathname;
      currentPage.name = pathname;
      resetReportedMetrics(pathname);
      initVitalsCollection(vitalsOptions);
    }, options.delay ?? 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
