import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useParams, useSearchParams } from '@umijs/max';
import React, { useRef, useState } from 'react';
import { monitorList } from '@/services/ant-design-pro/monitor';
import ErrorDetailDrawer from './components/ErrorDetailDrawer';

const CommonErrorList: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [searchParams] = useSearchParams();
  const errorType = Number(searchParams.get('type')) || 1; // 这里其实获取的是 ErrorType，也就是 subType
  const actionRef = useRef<ActionType>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.MonitorListItem>();

  // 1. 根据 errorType (subType) 反推 ReportType (type)
  // 如果是 1(JS), 2(Promise), 6(Vue), 7(React) -> ReportType.JAVASCRIPT_ERROR (7)
  // 如果是 5(Resource) -> ReportType.RESOURCE_ERROR (5)
  // 如果是 3(Network) -> ReportType.NETWORK_ERROR (6)
  let reportType = 7; // 默认为 JS 错误
  if (errorType === 5) {
    reportType = 5;
  } else if (errorType === 3) {
    reportType = 6;
  }

  const ErrorTypeMap = {
    1: { text: 'JavaScript 错误', status: 'Error' },
    2: { text: 'Promise 异常', status: 'Error' },
    3: { text: '网络错误', status: 'Error' },
    5: { text: '资源加载错误', status: 'Error' },
    6: { text: 'Vue 错误', status: 'Error' },
    7: { text: 'React 错误', status: 'Error' },
  };

  const columns: ProColumns<API.MonitorListItem>[] = [
    {
      title: '错误类型',
      dataIndex: 'subType',
      valueEnum: ErrorTypeMap,
      width: 150,
    },
    {
      title: '错误信息',
      dataIndex: ['data', 'message'],
      ellipsis: true,
      copyable: true,
    },
    {
      title: '错误栈',
      dataIndex: ['data', 'stack'],
      valueType: 'code',
      hideInTable: true,
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
      title: '用户ID',
      dataIndex: 'userId',
      width: 120,
    },
    {
      title: '浏览器信息',
      dataIndex: ['browserInfo', 'userAgent'],
      ellipsis: true,
      hideInTable: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            setCurrentRecord(record);
            setDetailVisible(true);
          }}
        >
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.MonitorListItem>
        headerTitle="错误列表"
        actionRef={actionRef}
        rowKey="_id"
        search={false}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await monitorList({
            type: reportType,
            subType: errorType,
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
      <ErrorDetailDrawer
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        record={currentRecord}
      />
    </PageContainer>
  );
};

export default CommonErrorList;
