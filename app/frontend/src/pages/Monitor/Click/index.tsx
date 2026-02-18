import { PageContainer } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Card, Empty, Spin, Table, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { getClickStats } from '@/services/ant-design-pro/monitor';

const ClickMonitor: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await getClickStats(appId);
      if (res.code === 200 && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appId]);

  const columns = [
    {
      title: '页面路径',
      dataIndex: 'pagePath',
      key: 'pagePath',
      width: 200,
      copyable: true,
    },
    {
      title: '点击元素 (HTML)',
      dataIndex: 'elementHtml',
      key: 'elementHtml',
      ellipsis: {
        showTitle: false,
      },
      render: (html: string) => (
        <Tooltip placement="topLeft" title={html}>
          <code>{html}</code>
        </Tooltip>
      ),
    },
    {
      title: '元素路径 (XPath)',
      dataIndex: 'xpath',
      key: 'xpath',
      ellipsis: true,
      copyable: true,
    },
    {
      title: '点击次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      sorter: (a: any, b: any) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <PageContainer title="用户点击监控">
      <Spin spinning={loading}>
        <Card title="点击热点列表">
          {data.length > 0 ? (
            <Table
              dataSource={data}
              columns={columns}
              loading={loading}
              rowKey={(record) => `${record.pagePath}-${record.xpath}`}
              pagination={{ pageSize: 20 }}
            />
          ) : (
            <Empty description="暂无点击数据" />
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default ClickMonitor;
