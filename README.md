# Markdown 笔记

本地笔记、搜索、标签和安全 Markdown 预览。这是一个可独立运行、可独立上传 GitHub 的浏览器 demo。

## 本地运行

需要 Node.js 22 或更新版本，无第三方依赖，无需 npm install。

```powershell
cd notes
npm start
```

打开 http://127.0.0.1:4173 。在本项目目录执行 `npm test` 运行领域逻辑测试，`npm run check` 检查脚本语法。若同时启动多个项目，先使用 `$env:PORT=4174` 等不同端口。

## 数据与使用

所有处理在浏览器本地完成，不调用远程接口。数据型 demo 使用 localStorage；请使用导出备份功能保存重要数据。浏览器清理站点数据后，本地保存的记录会消失。请通过本地 HTTP 服务访问，不要直接双击 HTML。

## 目录

- `index.html`：页面入口
- `app.js`：界面和浏览器交互
- `core.js`：可测试的领域逻辑
- `core.test.js`：边界条件及行为测试
- `base.css` / `style.css`：界面样式
- `server.mjs`：仅监听本机的静态文件服务

## 提交检查

执行 `npm run history` 查看当前仓库提交总数、日期和代码变更量；执行 `npm run history -- --details` 查看逐条提交明细。


## 领域文档

[标签](docs/tags.md) · [笔记模型](docs/note-model.md) · [编辑](docs/editing.md) · [搜索与统计](docs/search-and-statistics.md) · [Markdown](docs/markdown.md) · [备份](docs/backups.md) · [合并](docs/merge-and-conflicts.md) · [验证与恢复](docs/validation.md)
