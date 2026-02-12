import { ReportType } from '../reportType';

/**
 * PV 上报数据结构
 */
export interface PVReportData {
  /** 上报类型 */
  type: ReportType;
  /** 页面 URL（不含 hash） */
  pageUrl: string;
  /** 页面路径 */
  pagePath: string;
  /** 页面标题 */
  pageTitle: string;
  /** 来源页面 URL */
  referrer: string;
  /** 项目名称 */
  projectName: string;
  /** 环境 */
  environment: string;
  /** 用户 ID（可选） */
  userId: string | null;
  /** 设备唯一标识 */
  deviceUuid: string;
  /** 屏幕分辨率 */
  screenResolution: string;
  /** 语言 */
  language: string;
  /** 用户代理 */
  userAgent: string;
  /** 页面进入时间戳 */
  enterTime: number;
  /** 页面停留时长（ms，离开时计算） */
  duration: number;
  /** 上报时间戳 */
  reportTime: number;
}

/**
 * PV 监控配置
 */
export interface PVMonitorConfig {
  /** 上报接口地址 */
  reportUrl: string;
  /** 项目名称 */
  projectName: string;
  /** 环境 */
  environment: string;
  /** 用户 ID 获取函数 */
  getUserId?: () => string | null | undefined;
  /** 自定义上报函数（覆盖默认上报） */
  customReporter?: (data: PVReportData) => void;
}

// ===================== 内部状态 =====================

let pvConfig: PVMonitorConfig | null = null;
let pageEnterTime = 0;
let currentUrl = '';

/**
 * 获取设备唯一标识（复用 localStorage）
 */
const getDeviceUuid = (): string => {
  const KEY = 'minitrack_device_uuid';
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
 * 构造 PV 上报数据
 */
function buildPVData(duration: number = 0): PVReportData {
  const config = pvConfig!;
  return {
    type: ReportType.USER_BEHAVIOR,
    pageUrl: window.location.href.split('#')[0],
    pagePath: window.location.pathname,
    pageTitle: document.title,
    referrer: document.referrer,
    projectName: config.projectName,
    environment: config.environment,
    userId: config.getUserId?.() || null,
    deviceUuid: getDeviceUuid(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    userAgent: navigator.userAgent,
    enterTime: pageEnterTime,
    duration,
    reportTime: Date.now(),
  };
}

/**
 * 发送 PV 数据
 */
function sendPVData(data: PVReportData): void {
  if (!pvConfig) return;

  // 自定义上报
  if (pvConfig.customReporter) {
    pvConfig.customReporter(data);
    return;
  }

  // 默认上报：sendBeacon 优先
  const jsonData = JSON.stringify(data);

  if (navigator.sendBeacon) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const success = navigator.sendBeacon(pvConfig.reportUrl, blob);
    if (success) return;
  }

  if (typeof fetch !== 'undefined') {
    fetch(pvConfig.reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
      keepalive: true,
    }).catch((err) => console.error('[PV上报] 失败:', err));
  }
}

/**
 * 记录页面进入
 */
function recordPageEnter(): void {
  pageEnterTime = Date.now();
  currentUrl = window.location.href;

  const data = buildPVData(0);
  console.log('[PV] 页面进入', data);
  sendPVData(data);
}

/**
 * 记录页面离开（上报停留时长）
 */
function recordPageLeave(): void {
  if (!pageEnterTime) return;

  const duration = Date.now() - pageEnterTime;
  const data = buildPVData(duration);
  console.log('[PV] 页面离开，停留时长:', duration, 'ms');
  sendPVData(data);
}

/**
 * SPA 路由变化监听（拦截 pushState / replaceState / popstate）
 */
function listenSPARouteChange(): void {
  // 拦截 history.pushState
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    recordPageLeave();
    originalPushState.apply(this, args);
    recordPageEnter();
  };

  // 拦截 history.replaceState
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    recordPageLeave();
    originalReplaceState.apply(this, args);
    recordPageEnter();
  };

  // 监听浏览器前进/后退
  window.addEventListener('popstate', () => {
    recordPageLeave();
    recordPageEnter();
  });

  // 监听 hash 变化
  window.addEventListener('hashchange', () => {
    if (window.location.href !== currentUrl) {
      recordPageLeave();
      recordPageEnter();
    }
  });
}

// ===================== 对外 API =====================

/**
 * 初始化 PV 监控
 *
 * 功能：
 * - 页面进入时上报 PV
 * - 页面离开时上报停留时长
 * - SPA 路由切换自动追踪（pushState / replaceState / popstate / hashchange）
 * - 页面隐藏/卸载时上报最终停留数据
 */
export function initPVMonitor(config: PVMonitorConfig): void {
  if (typeof window === 'undefined') return;

  pvConfig = config;

  // 首屏 PV
  recordPageEnter();

  // SPA 路由监听
  listenSPARouteChange();

  // 页面隐藏时上报（移动端切后台）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      recordPageLeave();
    }
  });

  // 页面卸载兜底
  window.addEventListener('beforeunload', () => {
    recordPageLeave();
  });
}
