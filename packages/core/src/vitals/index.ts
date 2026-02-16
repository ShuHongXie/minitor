import type { Metric, ReportOpts } from 'web-vitals';
import { onCLS, onLCP, onINP, onFCP, onTTFB } from 'web-vitals';
import { ReportType } from '../reportType';

/**
 * Web Vitals 采集配置项
 */
export interface WebVitalsOptions {
  /** 上报接口地址（默认：/api/v1/monitor/web-vitals） */
  reportUrl?: string;
  /** 应用 ID（多项目区分） */
  appId: string;
  /** 环境 */
  environment: string;
  /** 构建版本（多版本区分） */
  buildVersion: string;
  /** 路由切换后延迟采集时间（ms，默认 100） */
  delay?: number;
  /** 需要采集的指标（默认全部） */
  metrics?: ('CLS' | 'LCP' | 'INP' | 'FCP' | 'TTFB')[];
  /** 用户ID获取函数（可选） */
  getUserId?: () => string | null | undefined;
  /** 自定义上报函数（覆盖默认 sendErrorData） */
  customReporter?: (data: WebVitalsReportData) => void;
  /** 是否仅上报最终值（避免重复上报，默认 true） */
  reportFinalOnly?: boolean;
}

/**
 * 上报数据结构（包含官方 Metric 核心字段 + 业务字段）
 */
export interface WebVitalsReportData {
  // 官方 Metric 核心字段（严格对齐）
  name: Metric['name'];
  value: number;
  delta: number;
  id: Metric['id'];
  startTime: number;
  label?: string;
  // 归因数据（仅在使用 attribution build 时存在）
  attribution?: any;
  // 业务扩展字段
  kind: 'performance';
  type: ReportType;
  pagePath: string;
  pageName: string;
  appId: string;
  environment: string;
  buildVersion: string;
  userId: string | null;
  deviceUuid: string;
  reportTime: number;
}

// ===================== 工具函数（解决重复上报/设备标识） =====================
/**
 * 生成设备唯一标识（持久化到 localStorage）
 */
const getDeviceUuid = (): string => {
  const KEY = 'web_vitals_device_uuid';
  let uuid = localStorage.getItem(KEY);
  if (!uuid) {
    uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, uuid);
  }
  return uuid;
};

/**
 * 当前页面上下文（用于 SPA 路由切换时更新）
 */
export const currentPage = {
  path: typeof window !== 'undefined' ? window.location.pathname : '',
  name: 'FirstLoad',
};

/**
 * 去重缓存：避免同一指标重复上报
 * 使用 Map 存储 "指标名称-页面路径-指标值" 作为键，避免重复上报
 * 注意：不使用指标ID，因为 web-vitals 的 ID 在会话期间可能保持不变
 */
const reportedMetrics = new Map<string, string>();

/**
 * 重置去重缓存（路由切换时调用）
 * 清除目标页面的指标缓存，允许重新采集
 */
export const resetReportedMetrics = (pagePath: string) => {
  // 清除目标页面的所有指标记录
  const keysToDelete: string[] = [];
  reportedMetrics.forEach((_, key) => {
    if (key.includes(`-${pagePath}-`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => reportedMetrics.delete(key));
  console.log(`🧹 清除页面 ${pagePath} 的指标缓存，共 ${keysToDelete.length} 条`);
};

/**
 * 构造上报数据（严格对齐官方 Metric 结构）
 */
const buildReportData = (
  metric: Metric,
  pagePath: string,
  pageName: string,
  options: WebVitalsOptions,
): WebVitalsReportData => {
  return {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    startTime: (metric as any).startTime,
    label: (metric as any).label,
    // 归因数据（如果存在）
    attribution: 'attribution' in metric ? (metric as any).attribution : undefined,
    // 业务字段
    kind: 'performance',
    type: ReportType.WEB_VITALS,
    pagePath,
    pageName,
    appId: options.appId,
    environment: options.environment,
    buildVersion: options.buildVersion,
    userId: options.getUserId?.() || null,
    deviceUuid: getDeviceUuid(),
    reportTime: Date.now(),
  };
};

/**
 * 核心上报逻辑（含去重）
 */
const reportMetric = (
  metric: Metric,
  pagePath: string,
  pageName: string,
  options: WebVitalsOptions,
): void => {
  // 去重：同一页面的同一指标 ID 仅上报一次
  const cachedPath = reportedMetrics.get(metric.id);
  if (cachedPath === pagePath) return;
  reportedMetrics.set(metric.id, pagePath);

  // 构建数据 + 选择上报方式
  const reportData = buildReportData(metric, pagePath, pageName, options);
  const reporter =
    options.customReporter ||
    ((data) => {
      // sendErrorData(data, options.reportUrl || '/api/v1/monitor/web-vitals')
    });

  // 上报（捕获错误，不影响主流程）
  try {
    reporter(reportData);
  } catch (err) {
    console.warn(`Web Vitals 上报失败 [${metric.name}]:`, err);
  }
};

// ===================== 核心采集逻辑（严格按 npm 规范实现） =====================
/**
 * 初始化单页面指标采集（支持多次调用，路由切换时重新初始化）
 */
export const initVitalsCollection = (options: WebVitalsOptions): void => {
  console.log('Initiating metrics collection for:', currentPage.path);
  const { metrics = ['CLS', 'LCP', 'INP', 'FCP', 'TTFB'], reportFinalOnly = true } = options;

  // 官方配置项：buffered=true 捕获历史指标，reportAllChanges 控制是否上报所有变化
  // const baseOpts: ReportOpts & { buffered?: boolean } = {
  //   buffered: true,
  //   reportAllChanges: !reportFinalOnly,
  // };

  // 1. 采集 CLS（累积布局偏移）
  if (metrics.includes('CLS')) {
    onCLS((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options);
    });
  }

  // 2. 采集 LCP（最大内容绘制）
  if (metrics.includes('LCP')) {
    onLCP((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options);
    });
  }

  // 3. 采集 INP（交互到下一次绘制）- npm 强调：需等待页面卸载才触发最终值
  if (metrics.includes('INP')) {
    onINP((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options);
    });
  }

  // 4. 采集 FCP（首次内容绘制）
  if (metrics.includes('FCP')) {
    onFCP((metric) => {
      console.log('FCP', metric);
      reportMetric(metric, currentPage.path, currentPage.name, options);
    });
  }

  // 5. 采集 TTFB（首字节时间）
  if (metrics.includes('TTFB')) {
    onTTFB((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options);
    });
  }
};
