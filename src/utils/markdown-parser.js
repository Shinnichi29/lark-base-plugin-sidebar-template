// src/utils/markdown-parser.js
import MarkdownIt from 'markdown-it'
import mathjax3 from 'markdown-it-mathjax3'

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true, // 允许解析HTML标签
  linkify: true, // 自动识别链接
  typographer: true // 启用排版优化
})

// 配置并启用 mathjax3（适配MathJax v3）
md.use(mathjax3, {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']], // 与index.html中的MathJax配置保持一致
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] // 跳过指定标签内的内容，避免解析冲突
  }
})

// 暴露解析方法
export const parseMarkdown = (content) => {
  if (!content) return ''
  return md.render(content)
}
