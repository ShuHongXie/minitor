<script setup lang="ts">
const btnFetchClick = () => {
  fetch('http://localhost:xxx999/buncunzai-quest'); // 端口不存在
};
</script>

<template>
  <button @click="btnFetchClick">触发 Fetch 请求失败</button>
</template>
