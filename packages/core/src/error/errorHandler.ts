import { sendErrorData } from './sender';
import { ErrorType } from './type';
import { extractFirstErrorFile } from './utils';

/**
 * 开启 JavaScript 错误监控
 * 监听并上报全局的 JavaScript 运行时错误和未处理的 Promise 异常
 *
 * @param {string} reportUrl - 错误上报的服务端接口地址
 * @param {string} projectName - 项目名称
 * @param {string} environment - 运行环境
 */
export const monitorJavaScriptErrors = (
  reportUrl: string,
  projectName: string,
  environment: string,
) => {
  const originalOnError = window.onerror;
  /*
     可以捕获，图片、script、css加载的错误,
     不可以捕获，new Image错误和fetch错误
     Promise内部抛出的错误是无法被error捕获到的，这时需要用unhandledrejection事件。
  */
  window.onerror = (message, source, lineno, colno, error) => {
    console.log('javascript error', message, source, lineno, colno, error);
    const stack = error ? error.stack : null;
    const errorInfo = {
      message,
      source,
      lineno,
      colno,
      stack,
      errorFilename: extractFirstErrorFile(stack),
      projectName,
      environment,
      errorType: ErrorType.JAVASCRIPT_ERROR,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    console.log('javascript error', errorInfo);

    sendErrorData(errorInfo, reportUrl);

    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
  };

  // 捕获Promise产生的错误
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const reason = (event as any).reason;
    const stack = reason && reason.stack ? reason.stack : null;
    const errorInfo = {
      message: reason ? reason.message || String(reason) : 'Unknown Promise Error',
      stack,
      errorFilename: extractFirstErrorFile(stack),
      projectName,
      environment,
      errorType: ErrorType.UNHANDLED_PROMISE_REJECTION,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    console.log('unhandledrejection-1', errorInfo, reason);

    sendErrorData(errorInfo, reportUrl);

    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(window, event);
    }
  };
};
