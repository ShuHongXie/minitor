import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import {
  addProject,
  projectList,
  removeProject,
  updateProject,
} from '@/services/ant-design-pro/project';

const ProjectList: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.ProjectListItem>();
  const actionRef = useRef<ActionType>();

  const handleAdd = async (fields: API.ProjectListItem) => {
    const hide = message.loading('正在添加');
    try {
      await addProject({ ...fields });
      hide();
      message.success('添加成功');
      return true;
    } catch (error) {
      hide();
      message.error('添加失败请重试！');
      return false;
    }
  };

  const handleUpdate = async (fields: API.ProjectListItem) => {
    const hide = message.loading('正在配置');
    try {
      await updateProject({
        ...currentRow,
        ...fields,
      });
      hide();
      message.success('配置成功');
      return true;
    } catch (error) {
      hide();
      message.error('配置失败请重试！');
      return false;
    }
  };

  const handleRemove = async (id: string) => {
    const hide = message.loading('正在删除');
    try {
      await removeProject(id);
      hide();
      message.success('删除成功，即将刷新');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('删除失败，请重试');
      return false;
    }
  };

  const columns: ProColumns<API.ProjectListItem>[] = [
    {
      title: '应用名称',
      dataIndex: 'name',
    },
    {
      title: 'App ID',
      dataIndex: 'appId',
      copyable: true,
      search: false,
    },
    {
      title: '描述',
      dataIndex: 'description',
      valueType: 'textarea',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      editable: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="config"
          onClick={() => {
            setCurrentRow(record);
            handleUpdateModalOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除吗？"
          onConfirm={() => handleRemove(record._id!)}
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ProjectListItem, API.PageParams>
        headerTitle="应用列表"
        actionRef={actionRef}
        rowKey="_id"
        search={{
          labelWidth: 80,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={projectList}
        columns={columns}
      />
      <ModalForm
        title="新建应用"
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const success = await handleAdd(value as API.ProjectListItem);
          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormText
          rules={[
            {
              required: true,
              message: '应用名称为必填项',
            },
          ]}
          width="md"
          name="name"
          label="应用名称"
        />
        <ProFormTextArea width="md" name="description" label="描述" />
      </ModalForm>
      <ModalForm
        title="编辑应用"
        width="400px"
        open={updateModalOpen}
        onOpenChange={handleUpdateModalOpen}
        initialValues={currentRow}
        modalProps={{
          destroyOnClose: true,
        }}
        onFinish={async (value) => {
          const success = await handleUpdate(value as API.ProjectListItem);
          if (success) {
            handleUpdateModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormText
          rules={[
            {
              required: true,
              message: '应用名称为必填项',
            },
          ]}
          width="md"
          name="name"
          label="应用名称"
        />
        <ProFormTextArea width="md" name="description" label="描述" />
      </ModalForm>
    </PageContainer>
  );
};

export default ProjectList;
