import { ReportType } from '../reportType';
import { sendData, sendRawData } from '../sender';

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
  /** 应用 ID */
  appId: string;
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
  /** 应用 ID */
  appId: string;
  /** 环境 */
  environment: string;
  /** 用户 ID 获取函数 */
  getUserId?: () => string | null | undefined;
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
    appId: config.appId,
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
 * 记录页面进入
 */
function recordPageEnter(): void {
  if (!pvConfig) return;
  pageEnterTime = Date.now();
  currentUrl = window.location.href;

  const data = buildPVData(0);
  console.log('[PV] 页面进入', data);
  sendRawData(data, pvConfig.reportUrl);
}

/**
 * 记录页面离开（上报停留时长）
 */
function recordPageLeave(): void {
  if (!pvConfig || !pageEnterTime) return;

  const duration = Date.now() - pageEnterTime;
  const data = buildPVData(duration);
  console.log('[PV] 页面离开，停留时长:', duration, 'ms');
  sendData(data, pvConfig.reportUrl);
}

/**
 * SPA 路由变化监听（拦截 pushState / replaceState / popstate）
 */
function listenSPARouteChange(): void {
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    recordPageLeave();
    originalPushState.apply(this, args);
    recordPageEnter();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    recordPageLeave();
    originalReplaceState.apply(this, args);
    recordPageEnter();
  };

  window.addEventListener('popstate', () => {
    recordPageLeave();
    recordPageEnter();
  });

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

  recordPageEnter();

  listenSPARouteChange();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      recordPageLeave();
    }
  });

  window.addEventListener('beforeunload', () => {
    recordPageLeave();
  });
}
