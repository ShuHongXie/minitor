import { Column } from '@ant-design/plots';
import { PageContainer } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Card, Empty, Spin, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { getPVStats } from '@/services/ant-design-pro/monitor';

const PVMonitor: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await getPVStats(appId);
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
      copyable: true,
    },
    {
      title: '访问量 (PV)',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
  ];

  const config = {
    data,
    xField: 'pagePath',
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
      },
    },
    meta: {
      pagePath: {
        alias: '页面',
      },
      count: {
        alias: '访问量',
      },
    },
  };

  return (
    <PageContainer title="页面访问 (PV) 监控">
      <Spin spinning={loading}>
        <Card title="页面访问排行" style={{ marginBottom: 24 }}>
          {data.length > 0 ? (
            <Column {...config} />
          ) : (
            <Empty description="暂无 PV 数据" />
          )}
        </Card>
        <Card title="详细数据">
          <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="pagePath"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default PVMonitor;
