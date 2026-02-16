export * from './error';
export * from './vitals';
export * from './reportType';
export { sendData, sendRawData, setGlobalContext, setSenderConfig } from './sender';
export * from './behavior';
// export * from './plugin'; // 移除插件导出，防止前端代码引入 Node.js 模块

import { initPVMonitor } from './behavior/pv';
import { initClickMonitor } from './behavior/click';
import { initErrorMonitor } from './error';
import { initVitalsCollection } from './vitals';
import { setGlobalContext, setSenderConfig, sendData, type SenderConfig } from './sender';

export interface MonitorConfig {
  appId: string;
  reportUrl: string;
  environment: string;
  userId?: string;
  release?: string;
  version?: string;
  senderConfig?: SenderConfig;
}

export function initMonitor(config: MonitorConfig) {
  if (config.senderConfig) {
    setSenderConfig(config.senderConfig);
  }

  // 1. 设置全局上下文 (sender 会自动合并这些字段)
  setGlobalContext({
    appId: config.appId,
    environment: config.environment,
    userId: config.userId,
    release: config.release,
    version: config.version,
  });

  // 2. 构造子模块配置
  // 注意：虽然 sender 会注入 appId，但子模块内部仍依赖 appId 字段进行逻辑处理
  const subConfig = {
    reportUrl: config.reportUrl,
    appId: config.appId,
    environment: config.environment,
    getUserId: config.userId ? () => config.userId : undefined,
  };

  // 3. 初始化各个监控模块
  initPVMonitor(subConfig);
  initClickMonitor(subConfig);
  initErrorMonitor(subConfig);

  // 4. 初始化 Web Vitals
  // Vitals 模块需要 buildVersion 且默认 reporter 为空，需手动传入 sendData
  initVitalsCollection({
    reportUrl: config.reportUrl,
    appId: config.appId,
    buildVersion: config.release || 'unknown',
    environment: config.environment,
    getUserId: config.userId ? () => config.userId : undefined,
    customReporter: (data) => {
      sendData(data, config.reportUrl);
    },
  });
}
