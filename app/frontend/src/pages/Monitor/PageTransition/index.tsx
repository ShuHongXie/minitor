import { Sankey } from '@ant-design/plots';
import { PageContainer } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Card, Empty, Spin, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { getPageTransitionStats } from '@/services/ant-design-pro/monitor';

const PageTransitionMonitor: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await getPageTransitionStats(appId);
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
      title: '来源页面 (From)',
      dataIndex: 'from',
      key: 'from',
      copyable: true,
    },
    {
      title: '目标页面 (To)',
      dataIndex: 'to',
      key: 'to',
      copyable: true,
    },
    {
      title: '跳转次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
  ];

  // 构造桑基图数据
  const sankeyData = data.map((item) => ({
    source: item.from || 'Direct Entry',
    target: item.to,
    value: item.count,
  }));

  const config = {
    data: sankeyData,
    sourceField: 'source',
    targetField: 'target',
    weightField: 'value',
    nodeWidthRatio: 0.008,
    nodePaddingRatio: 0.03,
  };

  return (
    <PageContainer title="页面跳转监控">
      <Spin spinning={loading}>
        <Card title="跳转路径流向 (Sankey)" style={{ marginBottom: 24 }}>
          {sankeyData.length > 0 ? (
            <Sankey {...config} />
          ) : (
            <Empty description="暂无跳转数据" />
          )}
        </Card>
        <Card title="详细跳转数据">
          <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey={(record) => `${record.from}-${record.to}`}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default PageTransitionMonitor;
