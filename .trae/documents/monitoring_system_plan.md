# 监控系统数据库设计与后端实现计划

## 1. 总体目标

基于 `packages/core` 的前端监控上报功能，设计并实现一个完整的监控系统后端。主要功能包括应用管理、监控数据接收与存储、以及 SourceMap 文件管理与堆栈还原支持。

## 2. 数据库设计 (MongoDB/Mongoose)

### 2.1 应用 (Project/Application)

用于锚定监控数据，每个应用拥有唯一的 `appId`。

- **Collection Name**: `projects`
- **Schema Fields**:
  - `name`: String (应用名称)
  - `appId`: String (唯一索引字段，用于替换原 projectName，作为数据上报的锚点)
  - `type`: String (应用类型，如 'web', 'mini-program')
  - `description`: String (描述)
  - `createdAt`: Date
  - `updatedAt`: Date

### 2.2 监控数据 (MonitorData)

存储所有上报的监控日志。为了提高查询效率，可以使用单一集合配合索引，或按 `type` 分集合。初期建议单一集合。

- **Collection Name**: `monitor_logs`
- **Schema Fields**:
  - `appId`: String (关联的应用 ID, 索引)
  - `type`: String (上报类型: 'USER_BEHAVIOR' | 'JAVASCRIPT_ERROR' | 'WEB_VITALS' | etc.)
  - `subType`: String (具体类型: 'pv', 'click', 'js_error', 'resource_error', 'LCP', 'CLS', etc.)
  - `release`: String (应用版本号，用于关联 SourceMap)
  - `environment`: String (环境: 'prod', 'dev', etc.)
  - `userId`: String (用户标识)
  - `timestamp`: Number (上报时间戳, 索引)
  - `data`: Object (混合类型，存储具体的上报详情，如 `pageUrl`, `stack`, `message` 等)
  - `browserInfo`: Object (设备/浏览器信息)

#### 数据结构详情 (Data Details)

- **Events (点击/交互)**
  - **核心字段**: `elementHtml`, `xpath`, `pageUrl`, `userId`, `reportTime`

- **Web Vitals (性能指标)**
  - **核心字段**:
    - `name`: 指标名称 ('LCP', 'CLS', 'INP', 'FCP', 'TTFB')
    - `value`: 指标数值
    - `rating`: 评分 ('good', 'needs-improvement', 'poor')
    - `delta`: 增量值
    - `id`: 指标 ID

### 2.3 SourceMap (SourceMap)

存储构建产物的 SourceMap 文件信息，用于还原代码堆栈。

- **Collection Name**: `sourcemaps`
- **Schema Fields**:
  - `appId`: String (关联应用)
  - `release`: String (版本号，必须与监控数据的 release 对应)
  - `fileName`: String (原始文件名，如 `app.123456.js.map`)
  - `filePath`: String (服务器存储路径)
  - `originalFileName`: String (对应的 JS 文件名)
  - `createdAt`: Date

## 3. 后端实现计划 (NestJS)

### 3.1 模块划分

在 `app/backend/src` 下新增以下模块：

1.  **ProjectsModule**: 管理应用的创建和查询。
2.  **MonitorModule**: 核心模块，负责接收上报数据。
3.  **SourceMapModule**: 负责 SourceMap 文件的上传和管理。

### 3.2 接口定义 (API)

#### ProjectsModule

- `POST /projects`: 创建新应用
  - Body: `{ name: string, type: string }`
  - Return: `{ id, appId, name, ... }`
- `GET /projects`: 获取应用列表

#### MonitorModule

- `POST /monitor/report`: 上报监控数据
  - Body: `ReportData` (单条或数组)
  - Logic:
    1. 校验 `appId` 是否有效。
    2. 识别数据类型 (`type`)。
    3. 异步存入 `monitor_logs` 集合。
    - _注_: 暂时不需要实现堆栈还原逻辑，先只负责存储。

#### SourceMapModule

- `POST /sourcemap/upload`: 上传 SourceMap 文件
  - Header: `x-app-id`, `x-release-version`
  - Body: `FormData` (file)
  - Logic:
    1. 校验应用和版本。
    2. 保存文件到本地存储或对象存储。
    3. 记录文件元数据到数据库。

## 4. 实施步骤

### 4.1 前端 SDK 改造 (packages/core)

为了支持全局配置（如 `appId`, `environment`），需要新增统一初始化入口。

1.  **新建 `init` 方法**:
    - 在 `packages/core/src/index.ts` 中暴露 `initMonitor(config)`。
    - `config` 包含: `appId` (必填, 替换原 `projectName`), `environment` (dev/prod), `reportUrl`。
2.  **全局上下文**:
    - 将配置存储在全局变量或单例中。
    - 修改 `sendData` 逻辑，在发送前自动合并 `appId` 和 `environment` 到数据中。

### 4.2 后端开发 (app/backend)

1.  **创建 Projects 模块**: 定义 Schema，实现创建和列表接口。
2.  **创建 Monitor 模块**: 定义 Log Schema，实现上报接收接口。
3.  **创建 SourceMap 模块**: 定义 Schema，配置 Multer 实现文件上传，实现元数据存储接口。

### 4.3 验证

1.  **SDK 测试**: 在前端项目中调用 `initMonitor`，验证上报数据是否包含 `appId`。
2.  **接口测试**: 验证后端是否能正确接收并存储带有 `appId` 的数据。

## 5. 待确认事项

- `packages/core` 的上报逻辑中是否已经包含 `appId` 和 `release`？如果未包含，后续需要更新前端 SDK 的初始化配置，确保上报时携带这些字段。目前计划在后端接口层面强制要求这些字段。
