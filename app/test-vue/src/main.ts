import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { MinitrackPlugin } from '@minitrack/vue';
import axios from 'axios';

const app = createApp(App);

app.use(router);

// 初始化 axios 配置
axios.defaults.baseURL = 'http://localhost:3000'; // 示例后端地址

// 使用 MinitrackPlugin 统一初始化监控
// 这将同时启动 PV、Click、JS错误、Vue组件错误、网络错误、资源错误以及 Web Vitals 监控
app.use(MinitrackPlugin, {
  appId: 'test-vue-app',
  reportUrl: '/api/monitor/report',
  environment: 'development',
  release: '1.0.0', // 对应 buildVersion
  // 如果有 router，可以在这里传入：router: router
  router,
  // vitalsDelay: 100,
  // vitalsReportFinalOnly: true,
  senderConfig: {
    batchSize: 1,
    sampleRate: 1,
  },
});

// 将 axios 挂载到全局属性，方便组件使用（可选）
app.config.globalProperties.$axios = axios;

app.mount('#app');
