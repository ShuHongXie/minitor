import { ReportType } from '../reportType';
import { sendRawData } from '../sender';

/**
 * 页面切换上报数据结构
 */
export interface PageTransitionData {
  /** 上报类型 */
  type: ReportType;
  /** 来源页面 URL */
  fromUrl: string;
  /** 来源页面路径 */
  fromPath: string;
  /** 目标页面 URL */
  toUrl: string;
  /** 目标页面路径 */
  toPath: string;
  /** 目标页面标题 */
  toTitle: string;
  /** 切换方式（pushState / replaceState / popstate / hashchange / load） */
  navigationType: 'pushState' | 'replaceState' | 'popstate' | 'hashchange' | 'load';
  /** 应用 ID */
  appId: string;
  /** 环境 */
  environment: string;
  /** 用户 ID */
  userId: string | null;
  /** 设备唯一标识 */
  deviceUuid: string;
  /** 上一个页面停留时长（ms） */
  fromDuration: number;
  /** 上报时间戳 */
  reportTime: number;
}

/**
 * 页面切换监控配置
 */
export interface PageTransitionConfig {
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

let transitionConfig: PageTransitionConfig | null = null;
let previousUrl = '';
let previousPath = '';
let pageEnterTime = 0;

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
 * 构造并上报页面切换数据
 */
function reportTransition(navigationType: PageTransitionData['navigationType']): void {
  if (!transitionConfig) return;

  const now = Date.now();
  const fromDuration = pageEnterTime > 0 ? now - pageEnterTime : 0;

  const data: PageTransitionData = {
    type: ReportType.PAGE_TRANSITION,
    fromUrl: previousUrl,
    fromPath: previousPath,
    toUrl: window.location.href,
    toPath: window.location.pathname,
    toTitle: document.title,
    navigationType,
    appId: transitionConfig.appId,
    environment: transitionConfig.environment,
    userId: transitionConfig.getUserId?.() || null,
    deviceUuid: getDeviceUuid(),
    fromDuration,
    reportTime: now,
  };

  console.log('[PageTransition]', `${previousPath} → ${window.location.pathname}`, navigationType);
  sendRawData(data, transitionConfig.reportUrl);

  // 更新状态：当前页变为"上一页"
  previousUrl = window.location.href;
  previousPath = window.location.pathname;
  pageEnterTime = now;
}

// ===================== 对外 API =====================

/**
 * 初始化页面切换监控
 *
 * 功能：
 * - 拦截 pushState / replaceState，记录编程式导航
 * - 监听 popstate（浏览器前进/后退）
 * - 监听 hashchange（hash 模式路由）
 * - 每次切换上报 from/to 页面信息及上一页停留时长
 */
export function initPageTransitionMonitor(config: PageTransitionConfig): void {
  if (typeof window === 'undefined') return;

  transitionConfig = config;
  previousUrl = window.location.href;
  previousPath = window.location.pathname;
  pageEnterTime = Date.now();

  // 拦截 pushState
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    // pushState 不会触发 popstate，需要手动上报
    reportTransition('pushState');
  };

  // 拦截 replaceState
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    reportTransition('replaceState');
  };

  // 浏览器前进/后退
  window.addEventListener('popstate', () => {
    reportTransition('popstate');
  });

  // hash 模式路由
  window.addEventListener('hashchange', () => {
    reportTransition('hashchange');
  });
}
