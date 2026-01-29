<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2025-02-27 06:39
 * @desc       : 主要页面
-->
<script setup>
  import { ref, onMounted, watch, nextTick } from 'vue';
  import { bitable } from '@lark-base-open/js-sdk';
  import MarkdownIt from 'markdown-it';
  import markdownItMathjax from 'markdown-it-mathjax';

  // 初始化Markdown解析器，使用markdown-it-mathjax插件处理公式
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true  // 启用单个换行符转换为<br>标签
  }).use(markdownItMathjax);

  // 选择的目标区域 'left' 或 'right'
  const selectedArea = ref('left');
  
  // 左右区域内容
  const leftContent = ref('');
  const rightContent = ref('');
  
  // 左右区域Markdown解析后的HTML
  const leftHtmlContent = ref('');
  const rightHtmlContent = ref('');

  // 左右区域锁定状态
  const leftLocked = ref(false);
  const rightLocked = ref(false);

  const base = bitable.base;

  // 动态加载MathJax 3
  const loadMathJax = () => {
    return new Promise((resolve) => {
      if (window.MathJax) {
        resolve();
        return;
      }

      // MathJax 3配置，支持所有常用的数学命令
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          packages: {
            '[+]': ['text']  // 确保text包被加载，支持\text命令
          },
          text: {
            inlineMath: [['$', '$'], ['\\(', '\\)']]
          }
        },
        svg: {
          fontCache: 'global'
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
          enableMenu: false,
          renderActions: {
            insertedScript: [200, () => {
              resolve();
            }]
          }
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  // 渲染MathJax公式
  const renderMathJax = async () => {
    await loadMathJax();
    if (window.MathJax) {
      try {
        // 清除之前的渲染任务
        window.MathJax.typesetClear();
        // 渲染当前页面的所有公式
        await window.MathJax.typesetPromise();
        console.log('MathJax渲染完成');
      } catch (e) {
        console.warn('MathJax渲染错误:', e);
      }
    }
  };

  // 自定义Markdown渲染函数，现在直接使用markdown-it-mathjax插件
  const renderMarkdown = (content) => {
    if (!content) return '';
    
    // 直接使用markdown-it-mathjax插件处理公式
    return md.render(content);
  };

  // 监听内容变化，自动重新渲染公式
  watch([leftContent, rightContent], async () => {
    if (selectedArea.value === 'left' && !leftLocked.value) {
      leftHtmlContent.value = renderMarkdown(leftContent.value);
    } else if (selectedArea.value === 'right' && !rightLocked.value) {
      rightHtmlContent.value = renderMarkdown(rightContent.value);
    }
    
    // 等待DOM更新后再渲染公式
    await nextTick();
    await renderMathJax();
  }, { immediate: false, deep: true });

  onMounted(async () => {
    selectedArea.value = 'left';
    // 添加默认的Markdown示例用于测试
    const defaultMarkdown = `# 公式测试示例

## 基础公式
- 行内公式：$E = mc^2$ 和 $F = ma$
- 块级公式：
$$
E = mc^2
$$

## 复杂公式
### 体积计算
公式：$V_c = \pi \times r^2 \times L$
(注意单位统一，建议全部换算成cm，得出的结果即为mL)

### 孔隙体积
计算死体积($V_m$)：乘以孔隙率($\epsilon$)
$$V_m = V_c \times \epsilon$$

- 全多孔填料(如C18)：$\epsilon$通常取0.65 (65%)
- 表面多孔填料(实心核)：$\epsilon$通常取0.55 (55%)

### 色谱柱平衡
通常建议用10-20倍柱体积的流动相来平衡色谱柱。例如对于一根30cm × 4.6mm的柱子（约3.3mL），平衡一次大概需要33mL - 66mL的流动相。

### 偏导数和链式法则
$$ \\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w} $$

### 包含文本的公式
$$V_m \\approx 0.5 \\times L\\text{(cm)} \\times d\\text{(cm)}^2 \\times \\pi / 4$$`;
    
    leftContent.value = defaultMarkdown;
    leftHtmlContent.value = renderMarkdown(defaultMarkdown);
    
    // 确保MathJax正确渲染公式
    await nextTick();
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

  // 切换左侧区域锁定状态
  function toggleLeftLock() {
    leftLocked.value = !leftLocked.value;
  }

  // 切换右侧区域锁定状态
  function toggleRightLock() {
    rightLocked.value = !rightLocked.value;
  }

  // 获取单元格内容的通用函数
  function getCellContent(data) {
    // 处理不同类型的单元格数据
    if (!data) return '';
    
    // 文本类型
    if (typeof data === 'string') {
      return data;
    }
    
    // 富文本类型 - 修复：拼接所有富文本元素的text属性
    if (Array.isArray(data) && data[0]?.text) {
      return data.map(item => item.text || '').join('');
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
        
        // 根据当前选中的区域更新内容，但仅在未锁定时更新
        if (selectedArea.value === 'left' && !leftLocked.value) {
          leftContent.value = cellContent;
          leftHtmlContent.value = renderMarkdown(cellContent);
          console.log('左侧解析结果:', leftHtmlContent.value);
        } else if (selectedArea.value === 'right' && !rightLocked.value) {
          rightContent.value = cellContent;
          rightHtmlContent.value = renderMarkdown(cellContent);
          console.log('右侧解析结果:', rightHtmlContent.value);
        }
        
        // 确保MathJax正确渲染公式
        await nextTick();
        await renderMathJax();
      } catch (error) {
        console.error('获取单元格内容失败:', error);
        // 错误信息也渲染成Markdown格式
        const errorContent = `# 错误
获取单元格内容失败: ${error.message}`;
        if (selectedArea.value === 'left' && !leftLocked.value) {
          leftHtmlContent.value = renderMarkdown(errorContent);
        } else if (selectedArea.value === 'right' && !rightLocked.value) {
          rightHtmlContent.value = renderMarkdown(errorContent);
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
        :class="{ 'selected': selectedArea === 'left', 'locked': leftLocked }"
        @click="selectLeftArea"
      >
        <div class="content-title">
          左侧区域
          <span class="selected-indicator" v-if="selectedArea === 'left'">✓</span>
          <button class="lock-button" @click.stop="toggleLeftLock" :title="leftLocked ? '解锁' : '锁定'">
            {{ leftLocked ? '🔒' : '🔓' }}
          </button>
        </div>
        <div 
          class="markdown-content" 
          v-html="leftHtmlContent || '<p>点击此区域选择，然后点击单元格将Markdown内容显示在这里</p>'"
        ></div>
      </div>
      
      <!-- 右侧区域 -->
      <div 
        class="content-area" 
        :class="{ 'selected': selectedArea === 'right', 'locked': rightLocked }"
        @click="selectRightArea"
      >
        <div class="content-title">
          右侧区域
          <span class="selected-indicator" v-if="selectedArea === 'right'">✓</span>
          <button class="lock-button" @click.stop="toggleRightLock" :title="rightLocked ? '解锁' : '锁定'">
            {{ rightLocked ? '🔒' : '🔓' }}
          </button>
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

  /* 锁定状态样式 */
  .content-area.locked {
    background-color: #f5f5f5;
    border-color: #999;
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

  /* 锁定按钮样式 */
  .lock-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .lock-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
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

  /* 锁定时内容区域样式 */
  .content-area.locked .markdown-content {
    background-color: #f0f0f0;
    cursor: not-allowed;
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

  /* 四级标题样式 */
  .markdown-content :deep(h4) {
    font-size: 16px;
    font-weight: bold;
    color: #000000;
    margin-bottom: 8px;
    margin-top: 16px;
  }

  /* 五级标题样式 */
  .markdown-content :deep(h5) {
    font-size: 15px;
    font-weight: bold;
    color: #000000;
    margin-bottom: 6px;
    margin-top: 14px;
  }

  /* 确保标题中的加粗文本显示为黑色 */
  .markdown-content :deep(h1 strong),
  .markdown-content :deep(h2 strong),
  .markdown-content :deep(h3 strong),
  .markdown-content :deep(h4 strong),
  .markdown-content :deep(h5 strong) {
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

  /* 数学公式样式优化 */
  .markdown-content :deep(.math-inline) {
    font-style: normal;
  }
  
  .markdown-content :deep(.math-display) {
    margin: 1em 0;
    text-align: center;
  }
  
  .markdown-content :deep(math) {
    font-size: 1.1em;
  }
  
  .markdown-content :deep(.MathJax) {
    overflow-x: auto;
    overflow-y: hidden;
  }
</style>