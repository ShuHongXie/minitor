/**
 * @description 获取浏览器信息,解析 userAgent 获取浏览器名称和版本
 * @return {{ name: string, version: string }} 包含浏览器名称和版本的对象
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let tem;
  const match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(match[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: tem[1] || '' };
  }
  if (match[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) {
      return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
    }
  }
  match[2] = match[2] || '';
  const name = match[1];
  const version = match[2];
  return { name, version };
};

/**
 * 格式化错误消息
 *
 * @param {any} err - 错误对象
 * @returns {string} 格式化后的错误字符串
 */
export const formatErrorMessage = (err: any): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

/**
 * 从错误堆栈中提取第一个错误文件名
 *
 * @param {string | null | undefined} stack - 错误堆栈字符串
 * @returns {string | null} 提取出的文件名
 */
export const extractFirstErrorFile = (stack: string | null | undefined): string | null => {
  if (!stack || typeof stack !== 'string') {
    return null;
  }
  const regex = /https?:\/\/[^/]+\/(?:.*\/)?(\\S+\\.js):(\d+):(\d+)/;
  const match = stack.match(regex);

  if (match) {
    return `${match[1]}`;
  }

  return null;
};

/**
 * 生成错误的唯一标识（基于错误核心信息的哈希）
 * @param errorData 错误数据
 * @returns 唯一标识字符串
 */
export function generateErrorKey(errorData: Record<string, any>): string {
  const keyStr = `${errorData.message || ''}-${errorData.stack || ''}`;
  return Array.from(new TextEncoder().encode(keyStr))
    .reduce((hash, char) => (hash << 5) - hash + char, 0)
    .toString();
}
