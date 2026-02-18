import { sendRawData } from '../sender';
import { ReportType } from '../reportType';

// ===================== 类型定义 =====================
export interface BlankScreenOptions {
  /** 应用 ID（必填） */
  appId: string;
  /** 环境 */
  environment: string;
  /** 上报接口地址 */
  reportUrl: string;
  /** 检测延迟时间（ms，默认 3000） */
  delay?: number;
  /** Loading 元素的 selector 列表（检测到这些元素存在时不报白屏） */
  loadingSelectors?: string[];
  /** 容器元素（如果采样点是这些元素，视为白屏点） */
  wrapperElements?: string[];
  /** 采样网格大小（默认 5x5） */
  gridSize?: number;
  /** 白屏判定阈值（0~1，默认 0.8，即 80% 的点为空则判定为白屏） */
  blankThreshold?: number;
  /** 用户ID获取函数 */
  getUserId?: () => string | null | undefined;
}

export interface BlankScreenReportData {
  type: ReportType;
  /** 白屏点数量 */
  emptyPoints: number;
  /** 总采样点数量 */
  totalPoints: number;
  /** 屏幕分辨率 */
  screenResolution: string;
  /** 视口大小 */
  viewPoint: string;
  /** 中心点元素 selector */
  selector: string;
  /** 页面 URL */
  pageUrl: string;
  /** 应用 ID */
  appId: string;
  /** 环境 */
  environment: string;
  /** 用户 ID */
  userId: string | null;
  /** 设备唯一标识 */
  deviceUuid: string;
  /** 上报时间戳 */
  reportTime: number;
}

// ===================== 工具函数 =====================
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

const getSelector = (element: Element | null): string => {
  if (!element) return '';
  if (element.id) return `#${element.id}`;
  if (element.className && typeof element.className === 'string') {
    const classList = element.className.split(/\s+/).filter(Boolean);
    if (classList.length > 0) {
      return `.${classList.join('.')}`;
    }
  }
  return element.tagName.toLowerCase();
};

// ===================== 核心检测逻辑 =====================
const checkBlankScreen = (options: BlankScreenOptions): void => {
  const {
    wrapperElements = ['html', 'body', '#app', '#root'],
    loadingSelectors = ['.loading', '.ant-spin', '.el-loading-mask'],
    gridSize = 5,
    blankThreshold = 0.8,
  } = options;

  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  let emptyPoints = 0;
  let totalPoints = 0;

  // 1. 检查是否有 Loading 元素（如果有，认为页面正在加载，暂不报白屏）
  const isLoading = loadingSelectors.some((selector) => document.querySelector(selector));
  if (isLoading) {
    console.log('[BlankScreen] Page is loading, skip detection.');
    return;
  }

  // 2. 网格采样
  const safeGridSize = Math.max(3, gridSize);
  const width = window.innerWidth;
  const height = window.innerHeight;

  for (let i = 0; i < safeGridSize; i++) {
    for (let j = 0; j < safeGridSize; j++) {
      const x = Math.floor((width * i) / (safeGridSize - 1));
      const y = Math.floor((height * j) / (safeGridSize - 1));

      // 修正边界坐标，避免 elementsFromPoint 返回空
      const safeX = x === 0 ? 1 : x === width ? width - 1 : x;
      const safeY = y === 0 ? 1 : y === height ? height - 1 : y;

      const elements = document.elementsFromPoint(safeX, safeY);
      const topElement = elements[0];

      totalPoints++;

      if (!topElement) {
        emptyPoints++;
        continue;
      }

      // 判断采样点是否落在容器元素上（即没有内容覆盖在容器上）
      const selector = getSelector(topElement);
      const tagName = topElement.tagName.toLowerCase();

      // 简单判断：如果是 wrapper 元素或者没有子元素的空 div，记为空点
      if (
        wrapperElements.includes(selector) ||
        wrapperElements.includes(tagName) ||
        wrapperElements.includes(`#${topElement.id}`) ||
        (tagName === 'div' && topElement.children.length === 0 && !topElement.textContent?.trim())
      ) {
        emptyPoints++;
      }
    }
  }

  // 3. 判定白屏
  if (totalPoints > 0 && emptyPoints / totalPoints >= blankThreshold) {
    const centerElement = document.elementFromPoint(width / 2, height / 2);

    const reportData: BlankScreenReportData = {
      type: ReportType.WHITE_SCREEN_ERROR,
      emptyPoints,
      totalPoints,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewPoint: `${width}x${height}`,
      selector: getSelector(centerElement),
      pageUrl: window.location.href,
      appId: options.appId,
      environment: options.environment,
      userId: options.getUserId?.() || null,
      deviceUuid: getDeviceUuid(),
      reportTime: Date.now(),
    };

    console.warn('[BlankScreen] Detected!', reportData);
    sendRawData(reportData, options.reportUrl);
  } else {
    console.log(
      `[BlankScreen] Check passed. Empty rate: ${(emptyPoints / totalPoints).toFixed(2)}`,
    );
  }
};

// ===================== 对外 API =====================

/**
 * 初始化白屏检测
 *
 * 原理：
 * 页面加载完成后（或路由切换后），延迟一段时间（默认3秒），
 * 在屏幕上进行网格采样（默认5x5=25个点）。
 * 如果大部分采样点（默认>80%）都落在容器元素（如 body, #app）上，
 * 而没有覆盖在具体内容元素上，则判定为白屏。
 */
export const initBlankScreenMonitor = (options: BlankScreenOptions): void => {
  if (typeof window === 'undefined') return;

  const { delay = 3000 } = options;

  // 1. 页面加载完成检测
  if (document.readyState === 'complete') {
    setTimeout(() => checkBlankScreen(options), delay);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => checkBlankScreen(options), delay);
    });
  }

  // 2. 路由切换检测 (SPA)
  // 监听 pushState / replaceState / popstate
  // 注意：这里简单实现，更好的方式是集成在路由守卫中，或者复用 PV 监控的路由监听逻辑
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(() => checkBlankScreen(options), delay);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(() => checkBlankScreen(options), delay);
  };

  window.addEventListener('popstate', () => {
    setTimeout(() => checkBlankScreen(options), delay);
  });
};
