import { Column } from '@ant-design/plots';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Col, Empty, Row, Spin, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { getWebVitalsStats } from '@/services/ant-design-pro/monitor';

const THRESHOLDS = {
  CLS: 0.1,
  LCP: 2500,
  INP: 200,
  FCP: 1800,
  TTFB: 600,
};

const WebVitals: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await getWebVitalsStats(appId);
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

  const config = {
    data,
    xField: 'name',
    yField: 'avgValue',
    color: ({ name, avgValue }: { name: string; avgValue: number }) => {
      const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
      return threshold && avgValue > threshold ? '#ff4d4f' : '#5B8FF9';
    },
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
      name: {
        alias: '指标名称',
      },
      avgValue: {
        alias: '平均耗时 (ms)',
      },
    },
  };

  return (
    <PageContainer title="Web Vitals 性能监控">
      <Spin spinning={loading}>
        {data.length > 0 ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {data.map((item) => {
                const threshold =
                  THRESHOLDS[item.name as keyof typeof THRESHOLDS];
                const isExceed = threshold && item.avgValue > threshold;
                return (
                  <Col span={4} key={item.name}>
                    <Card
                      hoverable
                      onClick={() =>
                        history.push(`/web-vitals/${appId}/detail/${item.name}`)
                      }
                      style={{
                        borderColor: isExceed ? '#ff4d4f' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      <Statistic
                        title={item.name}
                        value={item.avgValue}
                        precision={item.name === 'CLS' ? 4 : 2}
                        suffix={item.name === 'CLS' ? '' : 'ms'}
                        valueStyle={{ color: isExceed ? '#ff4d4f' : undefined }}
                      />
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: isExceed ? '#ff4d4f' : '#888',
                        }}
                      >
                        样本数: {item.count}
                        {isExceed && (
                          <span style={{ marginLeft: 8 }}>(已超标)</span>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            <Card title="指标平均耗时对比">
              <Column {...config} />
            </Card>
          </>
        ) : (
          <Empty description="暂无性能数据" />
        )}
      </Spin>
    </PageContainer>
  );
};

export default WebVitals;
