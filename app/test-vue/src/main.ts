import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { MinitrackPlugin } from '@minitrack/vue';
import axios from 'axios';

const app = createApp(App);

app.use(router);
// 示例后端地址

const initApp = async () => {
  let version = '';
  try {
    const res = await axios.post('/api/sourcemap/latest-version', {
      appId: 'dd505c46-1370-42ac-b712-f4cb0b68fd50',
    });
    if (res.data && res.data.version) {
      version = res.data.version;
      console.log('获取到的最新版本号:', version);
    }
  } catch (e) {
    console.warn('获取最新版本号失败:', e);
  }

  // 使用 MinitrackPlugin 统一初始化监控
  // 这将同时启动 PV、Click、JS错误、Vue组件错误、网络错误、资源错误以及 Web Vitals 监控
  app.use(MinitrackPlugin, {
    appId: 'dd505c46-1370-42ac-b712-f4cb0b68fd50',
    reportUrl: '/api/monitor/report',
    environment: 'development',
    release: '1.0.0', // 对应 buildVersion
    version: version, // 动态获取的 version
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
};

initApp();
