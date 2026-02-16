// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取应用列表 GET /api/projects */
export async function projectList(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    /** 应用名称 */
    name?: string;
  },
  options?: { [key: string]: any },
) {
  const msg = await request<{ data: API.ProjectListItem[]; total: number }>('/api/projects', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
  return {
    data: msg.data,
    total: msg.total,
    success: true,
  };
}

/** 新建应用 POST /api/projects */
export async function addProject(body: API.ProjectListItem, options?: { [key: string]: any }) {
  return request<API.ProjectListItem>('/api/projects', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新应用 PUT /api/projects/:id */
export async function updateProject(body: API.ProjectListItem, options?: { [key: string]: any }) {
  return request<API.ProjectListItem>(`/api/projects/${body._id}`, {
    method: 'PUT',
    data: body,
    ...(options || {}),
  });
}

/** 删除应用 DELETE /api/projects/:id */
export async function removeProject(id: string, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/projects/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
