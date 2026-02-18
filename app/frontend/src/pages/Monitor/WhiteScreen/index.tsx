import { Column } from '@ant-design/plots';
import { PageContainer } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Card, Empty, Spin, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { getWhiteScreenStats } from '@/services/ant-design-pro/monitor';

const WhiteScreenMonitor: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await getWhiteScreenStats(appId);
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
      title: '页面 URL',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      copyable: true,
      render: (url: string) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname + urlObj.search;
        } catch {
          return url;
        }
      },
    },
    {
      title: '完整 URL',
      dataIndex: 'pageUrl',
      key: 'fullUrl',
      ellipsis: true,
      copyable: true,
    },
    {
      title: '白屏发生次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
  ];

  const config = {
    data,
    xField: 'pageUrl',
    yField: 'count',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
        formatter: (v: string) => {
          try {
            const url = new URL(v);
            return url.pathname;
          } catch {
            return v;
          }
        },
      },
    },
    meta: {
      pageUrl: {
        alias: '页面',
      },
      count: {
        alias: '白屏次数',
      },
    },
  };

  return (
    <PageContainer title="白屏异常监控">
      <Spin spinning={loading}>
        <Card title="白屏高发页面排行" style={{ marginBottom: 24 }}>
          {data.length > 0 ? (
            <Column {...config} />
          ) : (
            <Empty description="暂无白屏数据" />
          )}
        </Card>
        <Card title="详细数据">
          <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="pageUrl"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default WhiteScreenMonitor;
