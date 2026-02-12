import type { App, Plugin } from 'vue';
import type { Router, RouteLocationNormalized } from 'vue-router';
import {
  initErrorMonitor,
  sendData,
  formatErrorMessage,
  extractFirstErrorFile,
  ErrorType,
  ReportType,
  initVitalsCollection,
  currentPage,
  resetReportedMetrics,
} from '@minitrack/core';
import type { ErrorMonitorConfig, WebVitalsOptions } from '@minitrack/core';

// ===================== 错误监控 Vue 插件 =====================

export type VueErrorMonitorOptions = ErrorMonitorConfig;

export const VueErrorMonitorPlugin = {
  /**
   * Vue 插件安装函数
   *
   * @param {any} app - Vue 应用实例
   * @param {VueErrorMonitorOptions} options - 插件配置项
   */
  install(app: any, options: VueErrorMonitorOptions) {
    if (!options || !options.reportUrl) return;

    // 初始化核心错误监控（JS错误、网络错误、资源错误）
    initErrorMonitor(options);

    const cfg = app.config;
    const original = cfg.errorHandler;

    /**
     * Vue 错误处理函数
     */
    cfg.errorHandler = (err: unknown, instance?: unknown, info?: unknown) => {
      const e = err as any;
      const stack = e && e.stack ? e.stack : null;

      sendData(
        {
          type: ReportType.ERROR,
          message: formatErrorMessage(err),
          stack,
          errorFilename: extractFirstErrorFile(stack),
          projectName: options.projectName,
          environment: options.environment,
          errorType: ErrorType.VUE_ERROR,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          info,
        },
        options.reportUrl,
      );

      console.log('vue内部错误', {
        message: formatErrorMessage(err),
        stack,
        errorFilename: extractFirstErrorFile(stack),
        projectName: options.projectName,
        environment: options.environment,
        errorType: ErrorType.VUE_ERROR,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        info,
      });

      if (typeof original === 'function') {
        try {
          (original as any)(err, instance, info);
        } catch {
          /* empty */
        }
      }
    };
  },
};

// ===================== Web Vitals Vue 插件 =====================

export interface WebVitalsPluginOptions extends WebVitalsOptions {
  /** Vue Router 实例（路由切换自动采集） */
  router?: Router;
}

export const WebVitalsPlugin: Plugin = {
  install(app: App, options: WebVitalsPluginOptions) {
    console.log('Web Vitals Plugin installed');
    // 最终配置（合并默认值）
    const finalOptions: WebVitalsPluginOptions = {
      reportUrl: '/api/v1/monitor/web-vitals',
      delay: 100,
      reportFinalOnly: true,
      ...options,
    };

    // 1. 首屏采集（页面加载完成后，只初始化一次）
    const initFirstLoad = () => {
      console.log('Initiating first load metrics collection');
      initVitalsCollection(finalOptions);
    };

    // 确保首屏采集时机正确（DOM 加载完成后）
    if (document.readyState === 'complete') {
      console.log('DOM is fully loaded');
      initFirstLoad();
    } else {
      console.log('DOM is not fully loaded, waiting for load event');
      window.addEventListener('load', initFirstLoad);
    }

    // 2. 路由切换采集（更新上下文 + 重置去重 + 重新初始化指标收集）
    if (finalOptions.router) {
      finalOptions.router.afterEach((to: RouteLocationNormalized) => {
        // 延迟执行，确保 DOM 更新完成
        setTimeout(() => {
          // 更新页面上下文
          currentPage.path = to.path;
          currentPage.name = (to.name as string) || 'UnknownPage';

          // 重置当前页面的去重缓存
          resetReportedMetrics(currentPage.path);

          // 重新初始化指标收集（关键：重新注册监听器）
          initVitalsCollection(finalOptions);
        }, finalOptions.delay);
      });
    }

    // 3. 挂载全局方法（支持组件内手动调用）
    app.config.globalProperties.$webVitals = {
      /**
       * 手动更新采集上下文并重新初始化
       * @param pagePath 页面路径
       * @param pageName 页面名称
       */
      init: (pagePath: string, pageName: string) => {
        currentPage.path = pagePath;
        currentPage.name = pageName;
        resetReportedMetrics(pagePath);
        initVitalsCollection(finalOptions);
      },
      /**
       * 手动销毁采集（不支持）
       */
      dispose: () => {
        console.warn('Web Vitals 监听无法手动销毁（库限制），仅重置上下文。');
      },
    };
  },
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $webVitals: {
      init: (pagePath: string, pageName: string) => void;
      dispose: () => void;
    };
  }
}
