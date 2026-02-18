import { history, useRouteProps } from '@umijs/max';
import { Card, Col, Row, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { projectList } from '@/services/ant-design-pro/project';

const { Paragraph } = Typography;

interface ProjectListCardProps {
  title?: string;
  errorType?: number;
  targetPath?: string;
}

const ProjectListCard: React.FC<ProjectListCardProps> = (props) => {
  const routeProps = useRouteProps();
  const errorType =
    props.errorType ?? routeProps?.errorType ?? routeProps?.props?.errorType;
  const title = props.title ?? routeProps?.title ?? routeProps?.props?.title;
  const targetPath =
    props.targetPath ?? routeProps?.targetPath ?? routeProps?.props?.targetPath;

  const [projects, setProjects] = useState<API.ProjectListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await projectList({ current: 1, pageSize: 100 });
        if (result.success && result.data) {
          setProjects(result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleCardClick = (appId: string) => {
    if (targetPath) {
      history.push(`${targetPath}/${appId}`);
      return;
    }
    // 确保 errorType 存在
    if (errorType === undefined || errorType === null) {
      console.error('errorType is missing');
      return;
    }
    const path =
      errorType === 5
        ? `/monitor/resource-error/${appId}`
        : `/monitor/common-error/${appId}?type=${errorType}`;
    history.push(path);
  };

  return (
    <Card title={title} loading={loading}>
      <Row gutter={[16, 16]}>
        {projects.map((project) => (
          <Col xs={24} sm={12} md={8} lg={6} key={project._id}>
            <Card
              hoverable
              onClick={() => handleCardClick(project.appId || '')}
              style={{ height: '100%' }}
            >
              <Card.Meta
                title={project.name}
                description={
                  <>
                    <Paragraph ellipsis={{ rows: 2 }}>
                      {project.description || '暂无描述'}
                    </Paragraph>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      AppID: {project.appId}
                    </div>
                  </>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default ProjectListCard;
