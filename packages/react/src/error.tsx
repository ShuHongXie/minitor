import React from 'react';
import {
  initErrorMonitor,
  sendErrorData,
  formatErrorMessage,
  extractFirstErrorFile,
} from '@minitrack/core';
import type { ErrorMonitorConfig } from '@minitrack/core';

// ===================== 类型定义 =====================

export type ReactErrorMonitorOptions = ErrorMonitorConfig;

export interface ErrorBoundaryProps {
  /** 监控配置 */
  options: ReactErrorMonitorOptions;
  /** 子组件 */
  children: React.ReactNode;
  /** 自定义错误降级 UI */
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ===================== ErrorBoundary 错误边界组件 =====================

/**
 * React 错误边界组件
 * 捕获子组件树的渲染错误并上报
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   options={{ reportUrl: '/api/errors', projectName: 'my-app', environment: 'production' }}
 *   fallback={<div>出错了</div>}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { options } = this.props;
    const stack = error.stack || null;

    sendErrorData(
      {
        message: formatErrorMessage(error),
        stack,
        errorFilename: extractFirstErrorFile(stack),
        projectName: options.projectName,
        environment: options.environment,
        errorType: 'React Error',
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      options.reportUrl,
    );

    console.log('React 组件错误', {
      message: formatErrorMessage(error),
      stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return fallback(this.state.error!);
      }
      return fallback ?? React.createElement('div', null, 'Something went wrong.');
    }
    return this.props.children;
  }
}

// ===================== useErrorMonitor Hook =====================

/**
 * 初始化全局错误监控（JS 错误、网络错误、资源错误）
 * 应在应用根组件中调用一次
 *
 * @example
 * ```tsx
 * function App() {
 *   useErrorMonitor({
 *     reportUrl: '/api/errors',
 *     projectName: 'my-app',
 *     environment: 'production',
 *   })
 *   return <div>...</div>
 * }
 * ```
 */
export function useErrorMonitor(config: ReactErrorMonitorOptions) {
  React.useEffect(() => {
    initErrorMonitor(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
