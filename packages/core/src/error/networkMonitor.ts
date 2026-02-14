import { sendData } from '../sender';
import { ReportType } from '../reportType';
import { ErrorType } from './type';

export interface NetworkErrorData {
  type: ReportType;
  message: string;
  url?: string;
  method?: string;
  status?: number;
  statusText?: string;
  appId: string;
  environment: string;
  errorType: ErrorType;
  timestamp: string;
  userAgent: string;
}

/**
 * 开启网络错误监控
 * 劫持并监听 XMLHttpRequest 和 fetch 请求，捕获网络异常
 *
 * @param {string} reportUrl - 错误上报地址
 * @param {string} appId - 应用 ID
 * @param {string} environment - 运行环境
 */
export const monitorNetworkErrors = (reportUrl: string, appId: string, environment: string) => {
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
    const _urlStr = typeof url === 'string' ? url : String(url);
    if (_urlStr.includes(reportUrl)) {
      return originalXhrOpen.apply(this, [method, url, ...args] as any);
    }
    this.addEventListener('error', () => {
      const errorInfo: NetworkErrorData = {
        type: ReportType.NETWORK_ERROR,
        message: `Network Error: ${method} ${url}`,
        appId,
        environment,
        errorType: ErrorType.NETWORK_ERROR,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      console.log('network error', errorInfo);
      sendData(errorInfo, reportUrl);
    });
    return originalXhrOpen.apply(this, [method, url, ...args] as any);
  };

  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const urlStr = input instanceof Request ? input.url : String(input);
    if (urlStr.includes(reportUrl)) {
      return originalFetch(input, init);
    }
    try {
      const response = await originalFetch(input, init);
      if (!response.ok) {
        const errorInfo: NetworkErrorData = {
          type: ReportType.NETWORK_ERROR,
          message: `Network Error: ${response.status} ${response.statusText}`,
          url: input instanceof Request ? input.url : String(input),
          appId,
          environment,
          errorType: ErrorType.FETCH_ERROR,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        };
        console.log('fetch error', errorInfo);
        sendData(errorInfo, reportUrl);
      }
      return response;
    } catch (error) {
      const errorInfo: NetworkErrorData = {
        type: ReportType.NETWORK_ERROR,
        message: `Fetch failed: ${input instanceof Request ? input.url : input}`,
        appId,
        environment,
        errorType: ErrorType.FETCH_ERROR,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      sendData(errorInfo, reportUrl);
      throw error;
    }
  };
};
