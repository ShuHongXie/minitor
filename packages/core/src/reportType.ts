/**
 * 上报数据类型枚举
 * 所有上报数据都必须包含 type 字段，用于区分不同类型的监控数据
 */
export enum ReportType {
  /**
   * 错误上报
   */
  ERROR = 1,

  /**
   * Web Vitals 性能指标上报
   */
  WEB_VITALS = 2,

  /**
   * 自定义事件上报
   */
  CUSTOM_EVENT = 3,

  /**
   * PV 上报
   */
  PV = 4,

  /**
   * 资源错误上报
   */
  RESOURCE_ERROR = 5,

  /**
   * 网络错误上报
   */
  NETWORK_ERROR = 6,

  /**
   * JS 错误上报
   */
  JAVASCRIPT_ERROR = 7,

  /**
   * 点击上报
   */
  CLICK = 8,

  /**
   * 页面切换上报
   */
  PAGE_TRANSITION = 9,

  /**
   * 白屏错误上报
   */
  WHITE_SCREEN_ERROR = 10,
}
