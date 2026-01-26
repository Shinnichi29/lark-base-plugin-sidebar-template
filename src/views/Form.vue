<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2025-02-27 06:39
 * @desc       : 主要页面
-->
<script setup>
  import { ref, onMounted } from 'vue';
  import { bitable } from '@lark-base-open/js-sdk';
  import MarkdownIt from 'markdown-it';

  // 初始化Markdown解析器
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  });

  // 选择的目标区域 'left' 或 'right'
  const selectedArea = ref('left');
  
  // 左右区域内容
  const leftContent = ref('');
  const rightContent = ref('');
  
  // 左右区域Markdown解析后的HTML
  const leftHtmlContent = ref('');
  const rightHtmlContent = ref('');

  const base = bitable.base;

  onMounted(async () => {
    selectedArea.value = 'left';
    // 添加默认的Markdown示例用于测试
    const defaultMarkdown = `# 标题一
## 标题二
### 标题三
**加粗文本** 和 *斜体文本*

- 列表项1
- 列表项2
- 列表项3

1. 有序列表项1
2. 有序列表项2
3. 有序列表项3

\`行内代码\`

\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

[链接文本](https://example.com)`;
    
    leftHtmlContent.value = md.render(defaultMarkdown);
  });

  // 点击左侧区域
  function selectLeftArea() {
    selectedArea.value = 'left';
  }

  // 点击右侧区域
  function selectRightArea() {
    selectedArea.value = 'right';
  }

  // 获取单元格内容的通用函数
  function getCellContent(data) {
    // 处理不同类型的单元格数据
    if (!data) return '';
    
    // 文本类型
    if (typeof data === 'string') {
      return data;
    }
    
    // 富文本类型
    if (Array.isArray(data) && data[0]?.text) {
      return data[0].text;
    }
    
    // 其他类型
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
  }

  // 监听单元格选择事件
  base.onSelectionChange(async (event) => {
    const { fieldId, recordId, tableId } = event.data;
    
    if (fieldId && recordId) {
      try {
        const table = await base.getActiveTable();
        const data = await table.getCellValue(fieldId, recordId);
        
        console.log('原始单元格数据:', data);
        
        // 获取单元格内容
        const cellContent = getCellContent(data);
        console.log('处理后的内容:', cellContent);
        
        // 根据当前选中的区域更新内容
        if (selectedArea.value === 'left') {
          leftContent.value = cellContent;
          leftHtmlContent.value = md.render(cellContent);
          console.log('左侧解析结果:', leftHtmlContent.value);
        } else {
          rightContent.value = cellContent;
          rightHtmlContent.value = md.render(cellContent);
          console.log('右侧解析结果:', rightHtmlContent.value);
        }
      } catch (error) {
        console.error('获取单元格内容失败:', error);
        // 错误信息也渲染成Markdown格式
        const errorContent = `# 错误
获取单元格内容失败: ${error.message}`;
        if (selectedArea.value === 'left') {
          leftHtmlContent.value = md.render(errorContent);
        } else {
          rightHtmlContent.value = md.render(errorContent);
        }
      }
    }
  });
</script>

<template>
  <div class="main">
    <!-- 只保留左右两个显示框 -->
    <div class="content-container">
      <!-- 左侧区域 -->
      <div 
        class="content-area" 
        :class="{ 'selected': selectedArea === 'left' }"
        @click="selectLeftArea"
      >
        <div class="content-title">
          左侧区域
          <span class="selected-indicator" v-if="selectedArea === 'left'">✓</span>
        </div>
        <div 
          class="markdown-content" 
          v-html="leftHtmlContent || '<p>点击此区域选择，然后点击单元格将Markdown内容显示在这里</p>'"
        ></div>
      </div>
      
      <!-- 右侧区域 -->
      <div 
        class="content-area" 
        :class="{ 'selected': selectedArea === 'right' }"
        @click="selectRightArea"
      >
        <div class="content-title">
          右侧区域
          <span class="selected-indicator" v-if="selectedArea === 'right'">✓</span>
        </div>
        <div 
          class="markdown-content" 
          v-html="rightHtmlContent || '<p>点击此区域选择，然后点击单元格将Markdown内容显示在这里</p>'"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main {
    font-weight: normal;
    padding: 1rem;
  }

  /* 左右布局样式 */
  .content-container {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    height: 90vh;
  }

  .content-area {
    width: 48%;
    height: 100%;
    border: 2px solid #ccc;
    padding: 20px;
    border-radius: 10px;
    box-sizing: border-box;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* 选中状态样式 */
  .content-area.selected {
    border-color: rgb(20, 86, 240);
    box-shadow: 0 0 0 2px rgba(20, 86, 240, 0.2);
  }

  .content-title {
    font-weight: bold;
    margin-bottom: 15px;
    color: rgb(20, 86, 240);
    font-size: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .selected-indicator {
    font-size: 20px;
    color: rgb(20, 86, 240);
  }

  /* Markdown内容区域样式 */
  .markdown-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background-color: #fafafa;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
  }

  /* Markdown解析后的样式 - 标题 */
  .markdown-content :deep(h1) {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }

  .markdown-content :deep(h2) {
    font-size: 20px;
    font-weight: bold;
    color: #555;
    margin-bottom: 12px;
    margin-top: 20px;
  }

  /* 三级标题样式 */
  .markdown-content :deep(h3) {
    font-size: 18px;
    font-weight: bold;
    color: #666;
    margin-bottom: 10px;
    margin-top: 18px;
  }

  .markdown-content :deep(strong) {
    font-weight: bold;
    color: #000;
  }

  .markdown-content :deep(em) {
    font-style: italic;
  }

  .markdown-content :deep(p) {
    margin-bottom: 10px;
  }

  /* 无序列表样式 */
  .markdown-content :deep(ul) {
    margin-left: 25px;
    margin-bottom: 15px;
    padding-left: 0;
    list-style-type: disc;
  }

  /* 有序列表样式 */
  .markdown-content :deep(ol) {
    margin-left: 25px;
    margin-bottom: 15px;
    padding-left: 0;
    list-style-type: decimal;
  }

  /* 列表项样式 */
  .markdown-content :deep(ul li) {
    margin-bottom: 8px;
    line-height: 1.7;
  }

  .markdown-content :deep(ol li) {
    margin-bottom: 8px;
    line-height: 1.7;
  }

  /* 嵌套列表样式 */
  .markdown-content :deep(ul ul) {
    margin-left: 20px;
    margin-top: 5px;
    list-style-type: circle;
  }

  .markdown-content :deep(ul ul ul) {
    list-style-type: square;
  }

  .markdown-content :deep(a) {
    color: rgb(20, 86, 240);
    text-decoration: none;
  }

  .markdown-content :deep(a:hover) {
    text-decoration: underline;
  }

  .markdown-content :deep(blockquote) {
    border-left: 4px solid rgb(20, 86, 240);
    padding-left: 15px;
    margin: 15px 0;
    color: #666;
    font-style: italic;
  }

  .markdown-content :deep(code) {
    background-color: #f0f0f0;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Courier New', Courier, monospace;
  }

  .markdown-content :deep(pre) {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 15px;
  }

  .markdown-content :deep(pre code) {
    background-color: transparent;
    padding: 0;
  }
</style>