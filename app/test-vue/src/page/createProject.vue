<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance() as any;

const form = ref({
  name: '',
  description: '',
});

const loading = ref(false);
const result = ref<any>(null);

const createProject = async () => {
  if (!form.value.name) {
    alert('请输入应用名称');
    return;
  }

  loading.value = true;
  result.value = null;

  try {
    const res = await proxy.$axios.post('/api/projects', form.value);
    result.value = res.data;
    alert('创建成功');
  } catch (error: any) {
    console.error('创建应用失败:', error);
    alert('创建失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="create-project-container">
    <h2>创建应用</h2>
    <div class="form-group">
      <label>应用名称:</label>
      <input v-model="form.name" placeholder="请输入应用名称" />
    </div>
    <div class="form-group">
      <label>描述:</label>
      <textarea v-model="form.description" placeholder="请输入描述"></textarea>
    </div>
    <button @click="createProject" :disabled="loading">
      {{ loading ? '创建中...' : '创建应用' }}
    </button>

    <div v-if="result" class="result-box">
      <h3>创建结果:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.create-project-container {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.result-box {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
