<script setup lang="ts">
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/github.css';
import { nextTick, onMounted, ref, computed } from 'vue';

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

const code = ref('');
const errorLine = ref(0);
const errorColumn = ref(0);
const codeLines = ref<string[]>([]);
const isExpanded = ref(false); // 展开/收起状态
const lineNumbersRef = ref<HTMLElement | null>(null); // 行号容器引用
const codeContentRef = ref<HTMLElement | null>(null); // 代码内容容器引用

// 计算需要显示的代码行
const visibleCodeLines = computed(() => {
  if (isExpanded.value || errorLine.value === 0) {
    return codeLines.value;
  }

  // 未展开时，只显示错误行及其上下8行
  const startLine = Math.max(0, errorLine.value - 9); // 从错误行上8行开始
  const endLine = Math.min(codeLines.value.length, errorLine.value + 8); // 到错误行下8行结束
  return codeLines.value.slice(startLine, endLine);
});

// 计算可见行的起始行号
const visibleStartLine = computed(() => {
  if (isExpanded.value || errorLine.value === 0) {
    return 1;
  }
  return Math.max(1, errorLine.value - 8);
});

// 同步滚动函数
const syncScroll = (source: 'lineNumbers' | 'codeContent', event: Event) => {
  const target = event.target as HTMLElement;
  const scrollTop = target.scrollTop;

  if (source === 'lineNumbers' && codeContentRef.value) {
    codeContentRef.value.scrollTop = scrollTop;
  } else if (source === 'codeContent' && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = scrollTop;
  }
};

// const axios = initRequestInstance({
//   baseURL: '/api',
// });

// 配置 marked
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'javascript';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true,
});

// 计算高亮后的代码HTML
const highlightedCode = computed(() => {
  if (!code.value) return '';

  // 处理错误行
  if (errorLine.value > 0) {
    const lines = code.value.split('\n');
    if (errorLine.value <= lines.length) {
      // 直接生成带有行号和高亮的代码块
      return generateCodeWithHighlight(code.value, errorLine.value);
    }
  }

  // 如果没有错误行，使用 marked 生成基本的代码块
  const markdown = `\`\`\`typescript\n${code.value}\n\`\`\``;
  return marked(markdown);
});

// 生成带有错误高亮的代码HTML
const generateCodeWithHighlight = (code: string, errorLineNum: number): string => {
  const lines = code.split('\n');
  let html = '<pre class="hljs"><code class="language-typescript">';

  // 确定需要显示的行范围
  let startLine = 0;
  let endLine = lines.length;

  if (!isExpanded.value && errorLineNum > 0) {
    // 未展开时，只显示错误行及其上下8行
    startLine = Math.max(0, errorLineNum - 9); // 从错误行上8行开始
    endLine = Math.min(lines.length, errorLineNum + 8); // 到错误行下8行结束
  }

  // 只处理可见行
  for (let i = startLine; i < endLine; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const isErrorLine = lineNum === errorLineNum;

    // 高亮当前行
    const highlightedLine = hljs.highlight(line, { language: 'typescript' }).value;

    if (isErrorLine) {
      // 处理错误行 - 只包裹错误行，不处理错误列
      html += `<span class="error-line-wrapper">${highlightedLine}</span>\n`;
    } else {
      // 非错误行直接输出
      html += `${highlightedLine}\n`;
    }
  }

  html += '</code></pre>';
  return html;
};

const btnJsClick = () => {
  const obj = {};
  console.log(obj.notExist.func()); // 典型空指针错误
};

onMounted(() => {
  // 获取 JS 错误列表
  fetch('/api/monitor/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      errorType: 7, // JAVASCRIPT_ERROR
      pageSize: 10,
      currentPage: 1,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log('Monitor List:', data);
      const firstError = data.list[0];
      console.log('firstError:', firstError);

      if (firstError) {
        // 解析第一个错误的源代码
        fetch('/api/monitor/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stack: firstError.data.stack }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log('堆栈解析结果:', data);
            code.value = data.data.sourceContent;
            errorLine.value = data.data.line;
            errorColumn.value = data.data.column;
            codeLines.value = code.value.split('\n');
            // stackParseResult.value = data.data.sourceContent;
          })
          .catch((err) => {
            console.error('解析失败:', err);
            // stackParseResult.value = { error: '请求失败', details: String(err) };
          });
      }
    });
});
</script>

<template>
  <div class="app-container">
    <button class="danger" id="btn-js" @click="btnJsClick">💥 触发 JS 运行时错误</button>
    <div class="editor-header">
      <h3>代码预览</h3>
      <button class="expand-button" @click="isExpanded = !isExpanded">
        {{ isExpanded ? '收起' : '展开' }} 代码
      </button>
    </div>
    <div class="code-editor-wrapper">
      <div class="line-numbers" ref="lineNumbersRef" @scroll="syncScroll('lineNumbers', $event)">
        <div
          v-for="(line, index) in visibleCodeLines"
          :key="index"
          class="line-number"
          :class="{ 'error-line-number': visibleStartLine + index === errorLine }"
        >
          {{ visibleStartLine + index }}
        </div>
      </div>
      <div
        class="code-content"
        ref="codeContentRef"
        @scroll="syncScroll('codeContent', $event)"
        v-html="highlightedCode"
      ></div>
    </div>
  </div>
</template>

<style lang="scss">
.app-container {
  padding: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .expand-button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fff;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
      border-color: #ccc;
    }

    &:active {
      background-color: #e8e8e8;
    }
  }
}

.code-editor-wrapper {
  display: flex;
  height: 400px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
  margin-top: 10px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.line-numbers {
  width: 60px;
  background-color: #f5f5f5;
  border-right: 1px solid #eee;
  padding: 16px 8px;
  text-align: right;
  color: #666;
  user-select: none;
  overflow-y: auto;

  .line-number {
    height: 21px;
    line-height: 21px;
    font-size: 12px;
  }

  .error-line-number {
    color: #d32f2f;
    font-weight: bold;
  }
}

.code-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #fff;

  pre {
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  code {
    font-family: inherit;
    font-size: inherit;
  }
}

// 错误行样式
.error-line-wrapper {
  display: block;
  background-color: rgba(255, 220, 220, 0.5);
  border-left: 3px solid #d32f2f;
  padding-left: 7px;
  margin-left: -7px;
  box-sizing: border-box;
  white-space: pre-wrap;
}

// 错误列字符样式
.error-char {
  background-color: #ff4444;
  color: white;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
}
</style>
