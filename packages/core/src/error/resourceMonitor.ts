import { sendData } from '../sender';
import { ReportType } from '../reportType';
import { ErrorType } from './type';

/**
 * 开启资源加载错误监控
 * 监听图片、脚本等资源加载失败的错误
 *
 * @param {string} reportUrl - 错误上报地址
 * @param {string} projectName - 项目名称
 * @param {string} environment - 运行环境
 */
export const monitorResourceErrors = (
  reportUrl: string,
  projectName: string,
  environment: string,
) => {
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT')) {
        const errorInfo = {
          type: ReportType.ERROR,
          message: `Resource Load Error: ${target.tagName} ${target.getAttribute('src') || target.getAttribute('href')}`,
          projectName,
          environment,
          errorType: ErrorType.RESOURCE_LOAD_ERROR,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        };
        console.log('静态资源错误', errorInfo);
        sendData(errorInfo, reportUrl);
      }
    },
    true,
  );
};
