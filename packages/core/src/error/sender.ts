import { getBrowserInfo, generateErrorKey } from './utils';
import { ReportType } from '../reportType';

interface ThrottleConfig {
  windowTime: number;
  maxCount: number;
  criticalErrors: string[];
}

interface BatchConfig {
  maxSize: number;
  timeout: number;
}

interface ErrorCacheItem {
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

const errorCache = new Map<string, ErrorCacheItem>();
let throttleCount = 0;
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
const errorBatchQueue: Record<string, any>[] = [];
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
  if (errorBatchQueue.length > 0) {
    const errorsToSend = [...errorBatchQueue];
    errorBatchQueue.length = 0;
    // 页面卸载时用最后一个错误的 url 作为上报地址
    // 实际场景中 url 应保持一致
    sendBatchErrorData(errorsToSend, lastReportUrl);
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
  errorBatchQueue.length = 0;
  errorCache.clear();
}

let lastReportUrl = '';

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, item] of errorCache.entries()) {
    if (now - item.timestamp > CONFIG.cacheExpire) {
      errorCache.delete(key);
    }
  }
}

function updateErrorCache(errorData: Record<string, any>): void {
  const key = generateErrorKey(errorData);
  errorCache.set(key, { timestamp: Date.now() });
}

function filterInvalidError(errorData: Record<string, any>): boolean {
  const message = errorData.message || '';
  if (message.includes('Script error.')) return false;
  if (
    errorData.fileName &&
    (errorData.fileName.includes('baidu.com') ||
      errorData.fileName.includes('google-analytics.com'))
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

function isDuplicateError(errorData: Record<string, any>): boolean {
  const key = generateErrorKey(errorData);
  const cacheItem = errorCache.get(key);
  cleanExpiredCache();
  return !!(cacheItem && Date.now() - cacheItem.timestamp < CONFIG.cacheExpire);
}

function checkThrottle(errorData: Record<string, any>): boolean {
  const message = errorData.message || '';
  const isCritical = CONFIG.throttle.criticalErrors.some((keyword) => message.includes(keyword));
  if (isCritical) return true;

  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      throttleCount = 0;
      throttleTimer = null;
    }, CONFIG.throttle.windowTime);
  }

  if (throttleCount >= CONFIG.throttle.maxCount) {
    console.warn(
      `[错误上报节流] 5秒内已上报${CONFIG.throttle.maxCount}条，本次拦截`,
      errorData.message,
    );
    return false;
  }

  throttleCount++;
  return true;
}

function checkSample(errorData: Record<string, any>): boolean {
  const message = errorData.message || '';
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
function sendBatchErrorData(errors: Record<string, any>[], url: string): void {
  if (errors.length === 0) return;

  console.log('[批量上报] 发送错误数据', errors);
  const browserInfo = getBrowserInfo();
  const dataToSend = errors.map((error) => {
    return {
      ...error,
      ...browserInfo,
      type: ReportType.ERROR,
    };
  });

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
 * 使用 requestIdleCallback 在浏览器空闲时执行回调
 * 不支持时降级为 setTimeout(_, 0)
 */
function scheduleIdleReport(callback: () => void): void {
  // 页面卸载时跳过空闲调度，直接执行
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
          // 空闲时间不足，下一次空闲再执行
          scheduleIdleReport(callback);
        }
      },
      { timeout: 3000 }, // 最多延迟 3 秒
    );
  } else {
    // 降级：下一个宏任务执行
    setTimeout(callback, 0);
  }
}

function triggerBatchReport(url: string): void {
  if (errorBatchQueue.length === 0) return;
  const errorsToSend = [...errorBatchQueue];
  errorBatchQueue.length = 0;
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  // 使用空闲调度发送
  scheduleIdleReport(() => sendBatchErrorData(errorsToSend, url));
}

function addToBatchQueue(errorData: Record<string, any>, url: string): void {
  lastReportUrl = url;
  errorBatchQueue.push(errorData);

  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      triggerBatchReport(url);
    }, CONFIG.batch.timeout);
  }

  if (errorBatchQueue.length >= CONFIG.batch.maxSize) {
    triggerBatchReport(url);
  }
}

/**
 * 错误上报统一入口（整合所有截流逻辑）
 * @param errorData 错误数据
 * @param url 上报接口地址
 */
export const sendErrorData = (errorData: Record<string, any>, url: string): void => {
  try {
    console.log('原始错误数据', errorData);

    if (!filterInvalidError(errorData)) {
      console.log('[过滤] 无效错误，拦截上报', errorData.message);
      return;
    }

    if (isDuplicateError(errorData)) {
      console.log('[去重] 重复错误，拦截上报', errorData.message);
      return;
    }

    if (!checkThrottle(errorData)) {
      return;
    }

    if (!checkSample(errorData)) {
      console.log('[采样] 未命中采样，拦截上报', errorData.message);
      return;
    }

    updateErrorCache(errorData);
    addToBatchQueue(errorData, url);
  } catch (error) {
    console.error('错误上报逻辑自身异常:', error);
  }
};
