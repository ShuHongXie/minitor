import type { App, Plugin } from 'vue';
import type { Router, RouteLocationNormalized } from 'vue-router';
import {
  initMonitor,
  sendData,
  formatErrorMessage,
  extractFirstErrorFile,
  ErrorType,
  ReportType,
  initVitalsCollection,
  currentPage,
  resetReportedMetrics,
  // vitePluginUploadSourcemap as _vitePluginUploadSourcemap,
  // vitePluginReplaceVersion as _vitePluginReplaceVersion,
} from '@minitrack/core';
import type { MonitorConfig, WebVitalsOptions } from '@minitrack/core';
// export const vitePluginUploadSourcemap = _vitePluginUploadSourcemap;
// export const vitePluginReplaceVersion = _vitePluginReplaceVersion;

// ===================== Minitrack Vue 插件 =====================

/**
 * Minitrack Vue 插件配置项
 * 继承自核心 MonitorConfig，并增加 Vue Router 支持
 */
export interface MinitrackVueOptions extends MonitorConfig {
  release: string;
  environment: any;
  reportUrl: any;
  appId: any;
  /** Vue Router 实例（用于 SPA 路由切换自动采集） */
  router?: Router;
  /** Web Vitals 采集延迟（ms，默认 100） */
  vitalsDelay?: number;
  /** 是否仅上报 Web Vitals 最终值（默认 true） */
  vitalsReportFinalOnly?: boolean;
}

export const MinitrackPlugin: Plugin = {
  /**
   * Vue 插件安装函数
   *
   * @param {App} app - Vue 应用实例
   * @param {MinitrackVueOptions} options - 插件配置项
   */
  install(app: App, options: MinitrackVueOptions) {
    if (!options || !options.appId || !options.reportUrl) {
      console.warn('[Minitrack] 插件安装失败：缺少 appId 或 reportUrl');
      return;
    }

    // 1. 初始化核心监控 (PV, Click, JS Error, Resource Error, Network Error, Vitals)
    // 注意：initMonitor 内部已经调用了 initVitalsCollection，完成了首屏 Vitals 采集
    initMonitor(options);

    console.log('[Minitrack] Vue 插件已安装，核心监控已启动');

    // 2. Vue 组件错误监控
    const originalHandler = app.config.errorHandler;
    app.config.errorHandler = (err: unknown, instance: unknown, info: string) => {
      const e = err as any;
      const stack = e && e.stack ? e.stack : null;

      // 上报 Vue 错误
      sendData(
        {
          type: ReportType.ERROR,
          message: formatErrorMessage(err),
          stack,
          errorFilename: extractFirstErrorFile(stack),
          appId: options.appId,
          environment: options.environment,
          errorType: ErrorType.VUE_ERROR,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          info,
        },
        options.reportUrl,
      );

      console.log('[Minitrack] Vue 内部错误', { message: err, info });

      // 调用原始 handler
      if (typeof originalHandler === 'function') {
        originalHandler(err, instance, info);
      }
    };

    // 3. Web Vitals Router 集成 (SPA 优化)
    // 虽然 initMonitor 已经启动了 Vitals，但对于 SPA，需要在路由切换时重置上下文并重新采集
    // if (options.router) {
    //   const vitalsOptions: WebVitalsOptions = {
    //     reportUrl: options.reportUrl,
    //     appId: options.appId,
    //     buildVersion: options.release || 'unknown',
    //     environment: options.environment,
    //     getUserId: options.userId ? () => options.userId : undefined,
    //     delay: options.vitalsDelay || 100,
    //     reportFinalOnly: options.vitalsReportFinalOnly ?? true,
    //     customReporter: (data) => {
    //       sendData(data, options.reportUrl);
    //     },
    //   };

    //   options.router.afterEach((to: RouteLocationNormalized) => {
    //     // 延迟执行，确保 DOM 更新完成
    //     setTimeout(() => {
    //       // 更新页面上下文
    //       currentPage.path = to.path;
    //       currentPage.name = (to.name as string) || 'UnknownPage';

    //       // 重置当前页面的去重缓存
    //       resetReportedMetrics(currentPage.path);

    //       // 重新初始化指标收集（关键：重新注册监听器以捕获当前路由的指标）
    //       // initVitalsCollection(vitalsOptions);
    //     }, vitalsOptions.delay);
    //   });
    // }

    // 4. 挂载全局方法 $minitrack (可选，提供手动控制能力)
    app.config.globalProperties.$minitrack = {
      // 可以在这里暴露更多手动上报方法
      report: (data: any) => sendData(data, options.reportUrl),
    };
  },
};

// 保持旧导出兼容性（标记为 @deprecated 建议）
/** @deprecated Use MinitrackPlugin instead */
export const VueErrorMonitorPlugin = {
  install(app: any, options: any) {
    console.warn('VueErrorMonitorPlugin is deprecated, please use MinitrackPlugin');
    // 简单转发，但不完全等同，建议用户迁移
    MinitrackPlugin.install?.(app, options);
  },
};

// 类型声明
declare module 'vue' {
  interface ComponentCustomProperties {
    $minitrack: {
      report: (data: any) => void;
    };
  }
}
