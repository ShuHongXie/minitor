import { getBrowserInfo, generateErrorKey } from './error/utils';

interface ThrottleConfig {
  windowTime: number;
  maxCount: number;
  criticalErrors: string[];
}

interface BatchConfig {
  maxSize: number;
  timeout: number;
}

interface CacheItem {
  timestamp: number;
}

// 全局配置
const CONFIG = {
  cacheExpire: 30 * 1000,
  throttle: {
    windowTime: 5 * 1000,
    maxCount: 10,
    criticalErrors: ['Uncaught TypeError', 'RangeError', 'Network Error'],
  } as ThrottleConfig,
  sampleRate: 0.4,
  batch: {
    maxSize: 10,
    timeout: 5 * 1000,
  } as BatchConfig,
};

const dataCache = new Map<string, CacheItem>();
let throttleCount = 0;
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
const batchQueue: Record<string, any>[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let isUnloading = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', onBeforeUnload);
}

/**
 * 页面卸载前：立即同步上报剩余队列（跳过空闲调度）
 */
function onBeforeUnload(): void {
  isUnloading = true;
  if (batchQueue.length > 0) {
    const dataToSend = [...batchQueue];
    batchQueue.length = 0;
    sendBatchData(dataToSend, lastReportUrl);
  }
  cleanupTimers();
}

function cleanupTimers(): void {
  if (throttleTimer) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  batchQueue.length = 0;
  dataCache.clear();
}

let lastReportUrl = '';

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, item] of dataCache.entries()) {
    if (now - item.timestamp > CONFIG.cacheExpire) {
      dataCache.delete(key);
    }
  }
}

function updateCache(data: Record<string, any>): void {
  const key = generateErrorKey(data);
  dataCache.set(key, { timestamp: Date.now() });
}

function filterInvalidData(data: Record<string, any>): boolean {
  const message = data.message || '';
  if (message.includes('Script error.')) return false;
  if (
    data.fileName &&
    (data.fileName.includes('baidu.com') || data.fileName.includes('google-analytics.com'))
  ) {
    return false;
  }
  const harmlessErrors = [
    'ResizeObserver loop limit exceeded',
    'requestIdleCallback is not defined',
  ];
  if (harmlessErrors.some((keyword) => message.includes(keyword))) return false;
  return true;
}

function isDuplicate(data: Record<string, any>): boolean {
  const key = generateErrorKey(data);
  const cacheItem = dataCache.get(key);
  cleanExpiredCache();
  return !!(cacheItem && Date.now() - cacheItem.timestamp < CONFIG.cacheExpire);
}

function checkThrottle(data: Record<string, any>): boolean {
  const message = data.message || '';
  const isCritical = CONFIG.throttle.criticalErrors.some((keyword) => message.includes(keyword));
  if (isCritical) return true;

  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      throttleCount = 0;
      throttleTimer = null;
    }, CONFIG.throttle.windowTime);
  }

  if (throttleCount >= CONFIG.throttle.maxCount) {
    console.warn(`[上报节流] 5秒内已上报${CONFIG.throttle.maxCount}条，本次拦截`, data.message);
    return false;
  }

  throttleCount++;
  return true;
}

function checkSample(data: Record<string, any>): boolean {
  const message = data.message || '';
  const isCritical = CONFIG.throttle.criticalErrors.some((keyword) => message.includes(keyword));
  if (isCritical) return true;
  const randomRate = Math.random();
  return randomRate <= CONFIG.sampleRate;
}

/**
 * 通过 Image 发送数据（最终降级方案）
 * 将数据编码到 URL query 参数中，通过 1x1 像素图片请求上报
 */
function sendViaImage(url: string, data: string): void {
  try {
    const img = new Image();
    const separator = url.includes('?') ? '&' : '?';
    img.src = `${url}${separator}data=${encodeURIComponent(data)}&_t=${Date.now()}`;
  } catch (e) {
    console.error('[Image上报] 失败:', e);
  }
}

/**
 * 渐进降级发送：sendBeacon → fetch → Image
 */
function sendBatchData(items: Record<string, any>[], url: string): void {
  if (items.length === 0) return;

  console.log('[批量上报] 发送数据', items);
  const browserInfo = getBrowserInfo();
  const dataToSend = items.map((item) => ({
    ...item,
    ...browserInfo,
  }));

  const jsonData = JSON.stringify(dataToSend);

  if (navigator.sendBeacon) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const success = navigator.sendBeacon(url, blob);
    if (success) return;
    console.warn('[sendBeacon] 发送失败，降级到 fetch');
  }

  if (typeof fetch !== 'undefined') {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
      keepalive: true,
    }).catch((error) => {
      console.warn('[fetch上报] 失败，降级到 Image:', error);
      sendViaImage(url, jsonData);
    });
    return;
  }

  sendViaImage(url, jsonData);
}

/**
 * 纯传输层：直接发送单条数据（不走去重/节流/采样/批量队列）
 * 适用于 PV、自定义事件等不需要错误过滤逻辑的场景
 *
 * 降级策略：sendBeacon → fetch → Image
 *
 * @param data 上报数据
 * @param url 上报接口地址
 */
export const sendRawData = (data: Record<string, any>, url: string): void => {
  const browserInfo = getBrowserInfo();
  const dataToSend = { ...data, ...browserInfo };
  const jsonData = JSON.stringify(dataToSend);

  if (navigator.sendBeacon) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const success = navigator.sendBeacon(url, blob);
    if (success) return;
  }

  if (typeof fetch !== 'undefined') {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
      keepalive: true,
    }).catch(() => {
      sendViaImage(url, jsonData);
    });
    return;
  }

  sendViaImage(url, jsonData);
};

/**
 * 使用 requestIdleCallback 在浏览器空闲时执行回调
 * 不支持时降级为 setTimeout(_, 0)
 */
function scheduleIdleReport(callback: () => void): void {
  if (isUnloading) {
    callback();
    return;
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(
      (deadline) => {
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          callback();
        } else {
          scheduleIdleReport(callback);
        }
      },
      { timeout: 3000 },
    );
  } else {
    setTimeout(callback, 0);
  }
}

function triggerBatchReport(url: string): void {
  if (batchQueue.length === 0) return;
  const itemsToSend = [...batchQueue];
  batchQueue.length = 0;
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  scheduleIdleReport(() => sendBatchData(itemsToSend, url));
}

function addToBatchQueue(data: Record<string, any>, url: string): void {
  lastReportUrl = url;
  batchQueue.push(data);

  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      triggerBatchReport(url);
    }, CONFIG.batch.timeout);
  }

  if (batchQueue.length >= CONFIG.batch.maxSize) {
    triggerBatchReport(url);
  }
}

/**
 * 通用数据上报入口（含去重、节流、采样、批量、空闲调度）
 * @param data 上报数据
 * @param url 上报接口地址
 */
export const sendData = (data: Record<string, any>, url: string): void => {
  try {
    console.log('[上报] 原始数据', data);

    if (!filterInvalidData(data)) {
      console.log('[过滤] 无效数据，拦截上报', data.message);
      return;
    }

    if (isDuplicate(data)) {
      console.log('[去重] 重复数据，拦截上报', data.message);
      return;
    }

    if (!checkThrottle(data)) {
      return;
    }

    if (!checkSample(data)) {
      console.log('[采样] 未命中采样，拦截上报', data.message);
      return;
    }

    updateCache(data);
    addToBatchQueue(data, url);
  } catch (error) {
    console.error('上报逻辑自身异常:', error);
  }
};
