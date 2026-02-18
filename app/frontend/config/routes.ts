/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    name: 'project-list',
    icon: 'table',
    path: '/projects',
    component: './ProjectList',
  },
  {
    name: 'web-vitals',
    icon: 'thunderbolt',
    path: '/web-vitals',
    component: './Monitor/components/ProjectListCard',
    props: {
      title: 'Web Vitals 性能监控',
      targetPath: '/web-vitals',
    },
  },
  {
    path: '/web-vitals/:appId',
    component: './Monitor/WebVitals',
    hideInMenu: true,
  },
  {
    path: '/web-vitals/:appId/detail/:metricName',
    component: './Monitor/WebVitals/Detail',
    hideInMenu: true,
  },
  {
    name: 'pv-monitor',
    icon: 'lineChart',
    path: '/pv',
    component: './Monitor/components/ProjectListCard',
    props: {
      title: '页面访问 (PV) 监控',
      targetPath: '/pv',
    },
  },
  {
    path: '/pv/:appId',
    component: './Monitor/PV',
    hideInMenu: true,
  },
  {
    name: 'click-monitor',
    icon: 'click',
    path: '/click',
    component: './Monitor/components/ProjectListCard',
    props: {
      title: '用户点击监控',
      targetPath: '/click',
    },
  },
  {
    path: '/click/:appId',
    component: './Monitor/Click',
    hideInMenu: true,
  },
  {
    name: 'page-transition-monitor',
    icon: 'swap',
    path: '/page-transition',
    component: './Monitor/components/ProjectListCard',
    props: {
      title: '页面跳转监控',
      targetPath: '/page-transition',
    },
  },
  {
    path: '/page-transition/:appId',
    component: './Monitor/PageTransition',
    hideInMenu: true,
  },
  {
    name: 'white-screen-monitor',
    icon: 'stop',
    path: '/white-screen',
    component: './Monitor/components/ProjectListCard',
    props: {
      title: '白屏异常监控',
      targetPath: '/white-screen',
    },
  },
  {
    path: '/white-screen/:appId',
    component: './Monitor/WhiteScreen',
    hideInMenu: true,
  },
  {
    name: 'monitor-list',
    icon: 'dashboard',
    path: '/monitor',
    routes: [
      {
        path: '/monitor',
        redirect: '/monitor/javascript-error',
      },
      {
        name: 'javascript-error',
        path: '/monitor/javascript-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: 'JavaScript 错误监控',
          errorType: 1,
        },
      },
      {
        name: 'promise-error',
        path: '/monitor/promise-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: 'Promise 异常监控',
          errorType: 2,
        },
      },
      {
        name: 'network-error',
        path: '/monitor/network-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: '网络错误监控',
          errorType: 3,
        },
      },
      {
        name: 'fetch-error',
        path: '/monitor/fetch-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: 'Fetch 请求错误监控',
          errorType: 4,
        },
      },
      {
        name: 'resource-error',
        path: '/monitor/resource-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: '资源加载错误监控',
          errorType: 5,
        },
      },
      {
        name: 'vue-error',
        path: '/monitor/vue-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: 'Vue 错误监控',
          errorType: 6,
        },
      },
      {
        name: 'react-error',
        path: '/monitor/react-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: 'React 错误监控',
          errorType: 7,
        },
      },
      {
        name: 'white-screen-error',
        path: '/monitor/white-screen-error',
        component: './Monitor/components/ProjectListCard',
        props: {
          title: '白屏错误监控',
          errorType: 8,
        },
      },
      {
        path: '/monitor/common-error/:appId',
        component: './Monitor/CommonError',
        hideInMenu: true,
      },
      {
        path: '/monitor/resource-error/:appId',
        component: './Monitor/ResourceError',
        hideInMenu: true,
      },
    ],
  },
  // {
  //   name: 'list.table-list',
  //   icon: 'table',
  //   path: '/list',
  //   component: './table-list',
  // },
  {
    path: '/',
    redirect: '/projects',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
