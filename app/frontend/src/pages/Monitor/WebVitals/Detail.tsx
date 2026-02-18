import { Column } from '@ant-design/plots';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Card, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { getWebVitalsPageStats } from '@/services/ant-design-pro/monitor';

const THRESHOLDS = {
  CLS: 0.1,
  LCP: 2500,
  INP: 200,
  FCP: 1800,
  TTFB: 600,
};

const WebVitalsDetail: React.FC = () => {
  const { appId, metricName } = useParams<{
    appId: string;
    metricName: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!appId || !metricName) return;
    setLoading(true);
    try {
      const res = await getWebVitalsPageStats(appId, metricName);
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
  }, [appId, metricName]);

  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS] || 0;
  const isCLS = metricName === 'CLS';
  const unit = isCLS ? '' : 'ms';

  const columns = [
    {
      title: '页面路径',
      dataIndex: 'pagePath',
      key: 'pagePath',
      copyable: true,
    },
    {
      title: isCLS ? '平均评分' : '平均耗时 (ms)',
      dataIndex: 'avgValue',
      key: 'avgValue',
      render: (value: number) => {
        const isExceed = value > threshold;
        return (
          <span
            style={{
              color: isExceed ? 'red' : 'inherit',
              fontWeight: isExceed ? 'bold' : 'normal',
            }}
          >
            {value.toFixed(isCLS ? 4 : 2)}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.avgValue - b.avgValue,
    },
    {
      title: '样本数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '最大值',
      dataIndex: 'max',
      key: 'max',
    },
    {
      title: '最小值',
      dataIndex: 'min',
      key: 'min',
    },
  ];

  const config = {
    data,
    xField: 'pagePath',
    yField: 'avgValue',
    color: ({ avgValue }: { avgValue: number }) => {
      return avgValue > threshold ? '#ff4d4f' : '#5B8FF9';
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
      avgValue: {
        alias: isCLS ? '平均评分' : '平均耗时 (ms)',
      },
    },
  };

  return (
    <PageContainer
      title={`${metricName} 性能详情`}
      extra={[
        <Button key="back" onClick={() => history.back()}>
          返回
        </Button>,
      ]}
    >
      <Card
        title="页面性能对比"
        extra={
          threshold ? (
            <span style={{ color: '#ff4d4f' }}>
              ⚠️ 告警阈值: {threshold} {unit}
            </span>
          ) : null
        }
        style={{ marginBottom: 24 }}
      >
        {data.length > 0 ? (
          <Column {...config} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>暂无数据</div>
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
    </PageContainer>
  );
};

export default WebVitalsDetail;
