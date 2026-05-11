# 行内 Markdown

renderInline 支持四种行内语法：

- `代码` → <code>；
- **粗体** → <strong>；*斜体* → <em>；
- [文字](链接) → <a>，仅接受 https、http、mailto；
- 其余内容全部 HTML 转义，脚本无法注入。

链接目标不安全时只保留文字本身。
