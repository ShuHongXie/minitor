import { sendData } from '../sender';
import { ReportType } from '../reportType';
import { ErrorType } from './type';

export interface ResourceErrorData {
  type: ReportType;
  tagName: string;
  url: string;
  appId: string;
  environment: string;
  reportTime: number;
}

/**
 * 开启资源加载错误监控
 * 监听图片、脚本等资源加载失败的错误
 *
 * @param {string} reportUrl - 错误上报地址
 * @param {string} appId - 应用 ID
 * @param {string} environment - 运行环境
 */
export const monitorResourceErrors = (reportUrl: string, appId: string, environment: string) => {
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement;
      // if (!target || target === window) return;
      if (!target) return;

      if (['IMG', 'SCRIPT', 'LINK', 'AUDIO', 'VIDEO'].includes(target.tagName)) {
        const errorData: ResourceErrorData = {
          type: ReportType.RESOURCE_ERROR,
          tagName: target.tagName,
          url: (target as any).src || (target as any).href,
          appId,
          environment,
          reportTime: Date.now(),
        };
        sendData(errorData, reportUrl);
      }
    },
    true,
  );
};
