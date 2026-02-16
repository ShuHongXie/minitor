import { Alert, Card, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { analyzeError } from '@/services/ant-design-pro/monitor';

const { Text, Paragraph } = Typography;

interface ErrorDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  record?: API.MonitorListItem;
}

const ErrorDetailDrawer: React.FC<ErrorDetailDrawerProps> = ({
  open,
  onClose,
  record,
}) => {
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<{
    sourceContent: string;
    line: number;
    column: number;
    source: string;
    name: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && record) {
      setLoading(true);
      setError(null);
      setAnalyzedData(null);

      const stack = record.data?.stack;
      if (!stack) {
        setLoading(false);
        setError('没有堆栈信息，无法解析');
        return;
      }

      analyzeError({ stack })
        .then((res) => {
          if (res.code === 200 && res.data) {
            setAnalyzedData(res.data);
          } else {
            setError(res.msg || '解析失败');
          }
        })
        .catch((err) => {
          setError('请求失败');
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, record]);

  const renderCode = () => {
    if (!analyzedData?.sourceContent) return null;

    const lines = analyzedData.sourceContent.split('\n');
    const errorLine = analyzedData.line; // start from 1
    // Show context: 10 lines before and after
    const startLine = Math.max(1, errorLine - 10);
    const endLine = Math.min(lines.length, errorLine + 10);

    const displayLines = lines.slice(startLine - 1, endLine);
    const displayContent = displayLines.join('\n');

    return (
      <SyntaxHighlighter
        language="javascript"
        style={vscDarkPlus}
        showLineNumbers
        startingLineNumber={startLine}
        wrapLines
        lineProps={(lineNumber) => {
          const style: React.CSSProperties = { display: 'block' };
          if (lineNumber === errorLine) {
            style.backgroundColor = '#5c2b2b'; // Darker red background for error line
            style.borderLeft = '4px solid #f44336';
          }
          return { style };
        }}
        customStyle={{
          fontSize: '14px',
          lineHeight: '1.5',
          margin: 0,
          borderRadius: '4px',
        }}
      >
        {displayContent}
      </SyntaxHighlighter>
    );
  };

  return (
    <Drawer
      title="错误详情与代码定位"
      width={800}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      {record && (
        <Descriptions
          column={1}
          bordered
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="错误信息">
            <Text type="danger">{record.data?.message}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="错误类型">
            <Tag color="red">{record.subType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发生时间">
            {new Date(record.timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="页面URL">
            {record.data?.pageUrl}
          </Descriptions.Item>
          <Descriptions.Item label="用户ID">
            {record.userId || '-'}
          </Descriptions.Item>
        </Descriptions>
      )}
      <Card title="堆栈信息" size="small" style={{ marginBottom: 24 }}>
        <Paragraph
          ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
          style={{
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            marginBottom: 0,
          }}
        >
          {record?.data?.stack || '无堆栈信息'}
        </Paragraph>
      </Card>
      <Card title="源代码定位" size="small" loading={loading}>
        {error ? (
          <Alert message={error} type="error" showIcon />
        ) : analyzedData ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue">文件: {analyzedData.source}</Tag>
              <Tag color="orange">行: {analyzedData.line}</Tag>
              <Tag color="orange">列: {analyzedData.column}</Tag>
              {analyzedData.name && (
                <Tag color="purple">符号: {analyzedData.name}</Tag>
              )}
            </div>
            {renderCode()}
          </>
        ) : (
          <Alert message="暂无分析数据" type="info" showIcon />
        )}
      </Card>
    </Drawer>
  );
};

export default ErrorDetailDrawer;
