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
  projectName: string;
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

  const { reportUrl, projectName, environment } = config;

  monitorJavaScriptErrors(reportUrl, projectName, environment);
  monitorNetworkErrors(reportUrl, projectName, environment);
  monitorResourceErrors(reportUrl, projectName, environment);

  __monitorInitialized = true;
};
