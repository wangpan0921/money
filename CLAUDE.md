# CLAUDE.md

本文件供 Claude / Claude Code 等 Agent 阅读。

本仓库的工程约定、目录结构、红线和部署流程统一维护在 **[AGENT.md](./AGENT.md)**，请以那份为准。下面只摘录最关键的几条，细节看 AGENT.md。

## TL;DR

- 「Agent 工坊」小应用合集：纯静态 HTML/CSS/原生 JS + 少量 PHP，**无构建步骤、零依赖**。
- 站点根 `index.html`；各应用在 `apps/<name>/`；共用埋点后端在 `api/`。
- 推 `main` 即通过 GitHub Actions FTP 部署到 InfinityFree。

## 最重要的红线

- **绝不提交 `api/config.php` 或任何真实数据库凭据。** 仓库里只放 `api/config.example.php`。
- **不引入框架/打包器/npm**，保持零依赖。
- 新增埋点事件要同步加进 `api/track.php` 的 `$allowed` 白名单。
- 界面文案与代码注释用简体中文，沿用现有深色主题风格。

完整说明见 [AGENT.md](./AGENT.md)。
