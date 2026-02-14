import { monitorJavaScriptErrors } from './errorHandler';
import { monitorNetworkErrors } from './networkMonitor';
import { monitorResourceErrors } from './resourceMonitor';

export {
  formatErrorMessage,
  extractFirstErrorFile,
  getBrowserInfo,
  generateErrorKey,
} from './utils';
export { ErrorType } from './type';
export { monitorJavaScriptErrors } from './errorHandler';
export { monitorNetworkErrors } from './networkMonitor';
export { monitorResourceErrors } from './resourceMonitor';

export interface ErrorMonitorConfig {
  reportUrl: string;
  appId: string;
  environment: string;
}

let __monitorInitialized = false;

/**
 * 初始化错误监控 SDK
 * 该函数是 SDK 的入口，负责启动各类错误监控模块
 *
 * @param {ErrorMonitorConfig} config - 监控配置对象
 */
export const initErrorMonitor = (config: ErrorMonitorConfig) => {
  if (__monitorInitialized) return;

  const { reportUrl, appId, environment } = config;

  monitorJavaScriptErrors(reportUrl, appId, environment);
  monitorNetworkErrors(reportUrl, appId, environment);
  monitorResourceErrors(reportUrl, appId, environment);

  __monitorInitialized = true;
};
