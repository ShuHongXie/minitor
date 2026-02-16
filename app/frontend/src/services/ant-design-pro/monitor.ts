// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取监控列表 POST /api/monitor/list */
export async function monitorList(
  body: {
    /** 错误类型 */
    type?: number;
    /** 二级错误类型 */
    subType?: number;
    /** 应用ID */
    appId?: string;
    /** 当前的页码 */
    currentPage?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  const msg = await request<{ list: API.MonitorListItem[]; total: number }>('/api/monitor/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
  return {
    data: msg.list,
    total: msg.total,
    success: true,
  };
}

/** 获取监控详情 GET /api/monitor/:id */
export async function monitorDetail(id: string, options?: { [key: string]: any }) {
  return request<API.MonitorListItem>(`/api/monitor/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 解析错误堆栈 POST /api/monitor/analyze */
export async function analyzeError(
  body: {
    stack: string;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    msg: string;
    code: number;
    data: {
      sourceContent: string;
      line: number;
      column: number;
      name: string | null;
      source: string;
    };
  }>('/api/monitor/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
