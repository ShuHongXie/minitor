/**
 * 错误类型枚举（数字型）
 */
export enum ErrorType {
  /**
   * JavaScript 运行时错误
   */
  JAVASCRIPT_ERROR = 1,

  /**
   * 未处理的 Promise 异常
   */
  UNHANDLED_PROMISE_REJECTION = 2,

  /**
   * Vue 组件错误
   */
  VUE_ERROR = 6,

  /**
   * React 组件错误
   */
  REACT_ERROR = 7,
}
