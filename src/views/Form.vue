<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2025-02-27 06:39
 * @desc       : 主要页面
-->
<script setup>
  import { ref, onMounted, watch } from 'vue';
  import { bitable } from '@lark-base-open/js-sdk';
  import MarkdownIt from 'markdown-it';
  // 使用更适合MathJax 3的插件
  import markdownItMathjax3 from 'markdown-it-mathjax3';

  // 初始化Markdown解析器，配置MathJax 3
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  }).use(markdownItMathjax3, {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']], // 支持$...$和\(...\)作为行内公式
      displayMath: [['$$', '$$'], ['\\[', '\\]']] // 支持$$...$$和\[...\]作为块级公式
    }
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

  // 动态加载MathJax
  const loadMathJax = () => {
    return new Promise((resolve) => {
      if (window.MathJax) {
        resolve();
        return;
      }

      // 配置MathJax
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true
        },
        svg: {
          fontCache: 'global'
        },
        startup: {
          ready: () => {
            resolve();
            MathJax.startup.defaultReady();
          }
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    });
  };

  // 渲染MathJax公式
  const renderMathJax = async () => {
    await loadMathJax();
    if (window.MathJax && MathJax.isReady) {
      try {
        await MathJax.typesetPromise();
      } catch (e) {
        console.warn('MathJax渲染错误:', e);
      }
    }
  };

  // 监听内容变化，重新渲染公式
  watch([leftHtmlContent, rightHtmlContent], async () => {
    await renderMathJax();
  }, { immediate: false });

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

[链接文本](https://example.com)

| 表头1 | 表头2 | 表头3 |
|------|------|------|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |

数学公式示例：
- 行内公式：$E = mc^2$ 和 $F = ma$
- 块级公式：
$$
E = mc^2
$$

BMI计算公式：
$$BMI=\\frac{体重(kg)}{身高(m)^2}=\\frac{80}{1.7^2}\\approx27.7$$

用户提供的示例：
1.实验装置：单色平行光垂直入射到双缝上，双缝间距为$d$，每条缝的宽度为$a$（$d \gg a$），双缝到观察屏的距离为$D$（$D \gg d$，远场条件）。
2.波长：入射光波长为$\\lambda$。
3.坐标：观察屏上某点到中央明纹中心的距离为$x$。`;
    
    leftHtmlContent.value = md.render(defaultMarkdown);
    
    // 确保MathJax正确渲染公式
    await renderMathJax();
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
        
        // 确保MathJax正确渲染公式
        await renderMathJax();
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
    color: #000000;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }

  .markdown-content :deep(h2) {
    font-size: 20px;
    font-weight: bold;
    color: #000000;
    margin-bottom: 12px;
    margin-top: 20px;
  }

  /* 三级标题样式 */
  .markdown-content :deep(h3) {
    font-size: 18px;
    font-weight: bold;
    color: #000000;
    margin-bottom: 10px;
    margin-top: 18px;
  }

  /* 确保标题中的加粗文本显示为黑色 */
  .markdown-content :deep(h1 strong),
  .markdown-content :deep(h2 strong),
  .markdown-content :deep(h3 strong) {
    color: #000;
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

  /* 表格样式 */
  .markdown-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 15px;
  }

  .markdown-content :deep(th),
  .markdown-content :deep(td) {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  .markdown-content :deep(th) {
    background-color: #f2f2f2;
    font-weight: bold;
    color: #333;
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

  /* 数学公式样式 */
  .markdown-content :deep(mjx-container) {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.2em 0;
  }
</style>