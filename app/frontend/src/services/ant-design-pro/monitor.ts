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

/** 获取 Web Vitals 统计数据 GET /api/monitor/vitals/:appId */
export async function getWebVitalsStats(
  appId: string,
  params?: { startTime?: number; endTime?: number },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      name: string;
      avgValue: number;
      count: number;
      max: number;
      min: number;
    }[];
  }>(`/api/monitor/vitals/${appId}`, {
    method: 'GET',
    params,
  });
}

/** 获取 Web Vitals 页面统计数据 GET /api/monitor/vitals/:appId/detail/:metricName */
export async function getWebVitalsPageStats(
  appId: string,
  metricName: string,
  params?: { startTime?: number; endTime?: number },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      pagePath: string;
      avgValue: number;
      count: number;
      max: number;
      min: number;
    }[];
  }>(`/api/monitor/vitals/${appId}/detail/${metricName}`, {
    method: 'GET',
    params,
  });
}

/** 获取 PV 统计数据 GET /api/monitor/pv/:appId */
export async function getPVStats(
  appId: string,
  params?: { startTime?: number; endTime?: number },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      pagePath: string;
      count: number;
    }[];
  }>(`/api/monitor/pv/${appId}`, {
    method: 'GET',
    params,
  });
}

/** 获取点击统计数据 GET /api/monitor/click/:appId */
export async function getClickStats(
  appId: string,
  params?: { startTime?: number; endTime?: number },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      pagePath: string;
      elementHtml: string;
      xpath: string;
      count: number;
    }[];
  }>(`/api/monitor/click/${appId}`, {
    method: 'GET',
    params,
  });
}

/** 获取页面跳转统计数据 GET /api/monitor/page-transition/:appId */
export async function getPageTransitionStats(
  appId: string,
  params?: { startTime?: number; endTime?: number },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      from: string;
      to: string;
      count: number;
    }[];
  }>(`/api/monitor/page-transition/${appId}`, {
    method: 'GET',
    params,
  });
}

/** 获取白屏统计数据 GET /api/monitor/white-screen/:appId */
export async function getWhiteScreenStats(
  appId: string,
  params?: { startTime?: number; endTime?: number },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      pageUrl: string;
      count: number;
    }[];
  }>(`/api/monitor/white-screen/${appId}`, {
    method: 'GET',
    params,
  });
}
