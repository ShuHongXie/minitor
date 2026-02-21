import http from 'http';
import httpServer from 'http-server';
import { createProxyMiddleware } from 'http-proxy-middleware';

// 1. 配置 http-server 基础服务（端口可自定义，比如 8080）
const server = httpServer.createServer({
  root: './dist', // 你的静态文件根目录（比如前端打包后的 dist 目录）
  port: 8080, // 前端访问的端口
});

// 2. 配置代理规则：/api 转发到 localhost:3000
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000', // 后端服务地址
  changeOrigin: true, // 必须开启，解决跨域和主机头问题
  pathRewrite: {
    '^/api': '', // 保持 /api 路径不变（如果想去掉可以写成 '^/api': ''）
  },
});

// 3. 拦截请求，匹配 /api 则走代理，否则走静态文件
const proxyServer = http.createServer((req, res) => {
  // 判断请求路径是否以 /api 开头
  if (req.url.startsWith('/api')) {
    apiProxy(req, res); // 走代理
  } else {
    server.server.emit('request', req, res); // 走静态文件
  }
});

// 4. 启动服务
const PORT = 8080;
proxyServer.listen(PORT, () => {
  console.log(`代理服务已启动：http://localhost:${PORT}`);

  console.log(`/api 请求会转发到：http://localhost:3000`);
});
