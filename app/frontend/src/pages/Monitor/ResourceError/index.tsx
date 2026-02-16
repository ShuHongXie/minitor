import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Button, Descriptions, Drawer, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { monitorDetail, monitorList } from '@/services/ant-design-pro/monitor';

const ResourceErrorList: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const actionRef = useRef<ActionType>();
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [currentDetail, setCurrentDetail] = useState<API.MonitorListItem>();

  const handleShowDetail = async (record: API.MonitorListItem) => {
    try {
      const result = await monitorDetail(record._id);
      setCurrentDetail(result);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to fetch detail:', error);
    }
  };

  const columns: ProColumns<API.MonitorListItem>[] = [
    {
      title: '资源类型',
      dataIndex: ['data', 'tagName'],
      width: 100,
      render: (_, record) => <Tag color="blue">{record.data?.tagName}</Tag>,
    },
    {
      title: '资源URL',
      dataIndex: ['data', 'url'],
      ellipsis: true,
      copyable: true,
    },
    {
      title: '发生时间',
      dataIndex: 'timestamp',
      valueType: 'dateTime',
      sorter: true,
      width: 180,
    },
    {
      title: '页面URL',
      dataIndex: ['data', 'pageUrl'],
      ellipsis: true,
      copyable: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a key="detail" onClick={() => handleShowDetail(record)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.MonitorListItem>
        headerTitle="资源加载错误列表"
        actionRef={actionRef}
        rowKey="_id"
        search={false}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await monitorList({
            type: 5, // ReportType.RESOURCE_ERROR
            appId,
            currentPage: current,
            pageSize,
          });
          return {
            data: result.data,
            success: result.success,
            total: result.total,
          };
        }}
        columns={columns}
      />
      <Drawer
        title="错误详情"
        width={600}
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
      >
        {currentDetail && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="App ID">
              {currentDetail.appId}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              {currentDetail.userId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发生时间">
              {new Date(currentDetail.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="页面URL">
              {currentDetail.data?.pageUrl}
            </Descriptions.Item>
            <Descriptions.Item label="资源URL">
              {currentDetail.data?.url}
            </Descriptions.Item>
            <Descriptions.Item label="资源类型">
              {currentDetail.data?.tagName}
            </Descriptions.Item>
            <Descriptions.Item label="XPath">
              {currentDetail.data?.xpath}
            </Descriptions.Item>
            <Descriptions.Item label="浏览器信息">
              {currentDetail.browserInfo?.userAgent}
            </Descriptions.Item>
            <Descriptions.Item label="屏幕分辨率">
              {currentDetail.browserInfo?.screenResolution}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ResourceErrorList;
