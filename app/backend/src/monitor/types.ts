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
   * 用户行为上报
   */
  USER_BEHAVIOR = 4,

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
}
