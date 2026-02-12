import { ReportType } from '../reportType';
import { sendRawData } from '../sender';

/**
 * 点击事件上报数据结构
 */
export interface ClickReportData {
  /** 上报类型 */
  type: ReportType;
  /** 被点击元素的 outerHTML（截断） */
  elementHtml: string;
  /** 元素唯一标识（DOM 路径） */
  xpath: string;
  /** 当前页面 URL */
  pageUrl: string;
  /** 当前页面路径 */
  pagePath: string;
  /** 项目名称 */
  projectName: string;
  /** 环境 */
  environment: string;
  /** 用户 ID */
  userId: string | null;
  /** 设备唯一标识 */
  deviceUuid: string;
  /** 上报时间戳 */
  reportTime: number;
}

/**
 * 点击事件监控配置
 */
export interface ClickMonitorConfig {
  /** 上报接口地址 */
  reportUrl: string;
  /** 项目名称 */
  projectName: string;
  /** 环境 */
  environment: string;
  /** 用户 ID 获取函数 */
  getUserId?: () => string | null | undefined;
  /**
   * 元素过滤器：返回 true 则上报该点击，返回 false 则忽略
   * 默认上报所有可交互元素（a, button, input, [data-track]...）
   */
  shouldTrack?: (element: HTMLElement) => boolean;
}

// ===================== 内部工具 =====================

/**
 * 获取设备唯一标识
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
 * 默认的可交互元素判断
 */
const DEFAULT_TRACKABLE_TAGS = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'LABEL',
  'IMG',
  'SVG',
  'VIDEO',
  'AUDIO',
]);

function isTrackableElement(el: HTMLElement): boolean {
  if (el.hasAttribute('data-track')) return true;
  if (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link') return true;
  if (DEFAULT_TRACKABLE_TAGS.has(el.tagName)) return true;
  return false;
}

/**
 * 获取元素的 DOM 路径（唯一标识）
 * 例如: "div.container > ul.list > li:nth-child(3) > a.link"
 */
function getDOMPath(el: HTMLElement, maxDepth: number = 5): string {
  const path: string[] = [];
  let current: HTMLElement | null = el;
  let depth = 0;

  while (current && current !== document.body && depth < maxDepth) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        selector += `.${classes.join('.')}`;
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return path.join(' > ');
}

/**
 * 获取元素 outerHTML（去除子节点内容，避免过长）
 */
function getElementHtml(el: HTMLElement, maxLength: number = 200): string {
  const clone = el.cloneNode(false) as HTMLElement;
  // 只保留元素自身标签和属性，内部用 ... 代替
  const html = clone.outerHTML.replace('></', '>...</');
  return html.length > maxLength ? html.slice(0, maxLength) + '...' : html;
}

/**
 * 向上查找最近的可追踪元素
 */
function findTrackableAncestor(
  target: HTMLElement,
  shouldTrack: (el: HTMLElement) => boolean,
  maxDepth: number = 5,
): HTMLElement | null {
  let current: HTMLElement | null = target;
  let depth = 0;
  while (current && current !== document.body && depth < maxDepth) {
    if (shouldTrack(current)) return current;
    current = current.parentElement;
    depth++;
  }
  return null;
}

let clickConfig: ClickMonitorConfig | null = null;

// touchstart 与 mousedown 去重标记
let isTouchEvent = false;
let touchResetTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 统一的上报处理函数
 */
function handleInteraction(event: Event, shouldTrack: (el: HTMLElement) => boolean): void {
  const target = event.target as HTMLElement;
  if (!target) return;

  const trackableEl = findTrackableAncestor(target, shouldTrack);
  if (!trackableEl) return;

  const data: ClickReportData = {
    type: ReportType.USER_BEHAVIOR,
    elementHtml: getElementHtml(trackableEl),
    xpath: getDOMPath(trackableEl),
    pageUrl: window.location.href,
    pagePath: window.location.pathname,
    projectName: clickConfig!.projectName,
    environment: clickConfig!.environment,
    userId: clickConfig!.getUserId?.() || null,
    deviceUuid: getDeviceUuid(),
    reportTime: Date.now(),
  };

  console.log('[Click]', data.xpath);
  sendRawData(data, clickConfig!.reportUrl);
}

/**
 * 初始化点击事件监控
 *
 * 功能：
 * - 使用 mousedown + touchstart 捕获用户交互（比 click 更早、更可靠）
 * - 触屏设备自动去重（touchstart 触发后 300ms 内忽略 mousedown）
 * - 自动过滤非交互元素，仅上报有意义的用户点击
 * - 上报元素 HTML 和唯一标识（DOM 路径）
 * - 支持自定义过滤器（shouldTrack）
 *
 * @example
 * ```ts
 * initClickMonitor({
 *   reportUrl: '/api/v1/monitor/click',
 *   projectName: 'my-app',
 *   environment: 'production',
 * });
 * ```
 */
export function initClickMonitor(config: ClickMonitorConfig): void {
  if (typeof window === 'undefined') return;

  clickConfig = config;

  const shouldTrack = config.shouldTrack || isTrackableElement;

  // touchstart：移动端优先触发
  document.addEventListener(
    'touchstart',
    (event) => {
      isTouchEvent = true;

      // 300ms 后重置标记，允许后续纯鼠标操作
      if (touchResetTimer) clearTimeout(touchResetTimer);
      touchResetTimer = setTimeout(() => {
        isTouchEvent = false;
      }, 300);

      handleInteraction(event, shouldTrack);
    },
    true,
  );

  // mousedown：桌面端 + 触屏设备去重
  document.addEventListener(
    'mousedown',
    (event) => {
      // 如果刚触发过 touchstart，跳过此次 mousedown（去重）
      if (isTouchEvent) return;
      handleInteraction(event, shouldTrack);
    },
    true,
  );
}
