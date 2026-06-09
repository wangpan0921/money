# AGENT.md

写给在本仓库里干活的编码 Agent。先读这份，再动手。

## 这是什么项目

「Agent 工坊」—— 一个人 + 一个 Agent 一起做的小应用合集，部署在 InfinityFree（免费 PHP + MySQL 虚拟主机）上。

- 站点根是 `index.html`，一个纯静态的应用导航页。
- 每个小应用在 `apps/<name>/` 下，彼此独立。
- `api/` 是共用的轻量埋点后端（PHP + MySQL）。
- 没有构建步骤、没有包管理器、没有框架。纯 HTML/CSS/原生 JS + 少量 PHP。

## 目录结构

```
.
├── index.html              # 主页:应用导航卡片 + 埋点
├── js/tracker.js           # 共用埋点客户端 (window.Tracker.track)
├── api/                    # 共用埋点后端 (PHP)
│   ├── db.php              # PDO 连接、client_ip()、clip() 工具
│   ├── track.php           # POST 埋点写入入口,带 event_type 白名单
│   ├── stats.php           # 后台统计页,HTTP Basic Auth 保护
│   ├── config.example.php  # 配置模板;复制成 config.php 填真实凭据
│   └── config.php          # 真实凭据,!! 不入仓库 (见 .gitignore)
├── sql/schema.sql          # usage_events 建表语句
├── apps/
│   ├── income/             # 中国个税计算器(纯前端)
│   ├── ypwd/               # Android 密码管理器 APK 下载页 + PHP 计数
│   └── kiro-retry/         # kiro-cli 自动重试脚本的展示/下载页
└── .github/workflows/deploy.yml  # 推 main 自动 FTP 部署到 InfinityFree
```

## 各应用速览

- **income**(`apps/income/`):中国个税计算器。累计预扣预缴、专项附加扣除、年终奖最优计税、RSU/期权/ESPP。纯前端,数据不上传。逻辑在 `app.js` / `tax.js` / `stock.js`。
- **ypwd**(`apps/ypwd/`):Android 小密码管理器的 APK 下载页。`record_download.php` / `get_count.php` 记录与展示下载次数。`website/` 是辅助资料,不上线。
- **kiro-retry**(`apps/kiro-retry/`):`kiro-agent-retry.sh` 的在线查看 + 下载页。`.htaccess` 把 `.sh` 以 `text/plain` 内联返回。

## 约定与红线

- **永远不要提交 `api/config.php`**。真实数据库凭据只放在服务器上;仓库里只有 `config.example.php`。`.gitignore` 已忽略 `config.php` 和 `doc/`。
- **不要把凭据写进代码**。注意:`apps/ypwd/get_count.php` 和 `record_download.php` 里目前硬编码了一组旧的数据库凭据,这是历史遗留的反面教材,别照抄;新代码一律走 `api/config.php` 这种外置配置。
- **保持零依赖**。不要引入框架、打包器、npm。改前端就改原生 HTML/CSS/JS。
- **新增埋点事件**必须同步更新 `api/track.php` 里的 `$allowed` 白名单,否则后端会 400 拒收。
- **风格**:界面文案用简体中文;深色主题 CSS 变量定义在各页面 `:root`(参考 `index.html`)。代码注释也用中文,跟现有风格保持一致。
- 时间统一按北京时间(`db.php` 里 `SET time_zone='+08:00'`)。

## 本地预览

纯静态部分直接用任意静态服务器即可:

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000/
```

要测 PHP 接口需要本地 PHP + MySQL:复制 `api/config.example.php` 为 `api/config.php` 填本地库凭据,执行 `sql/schema.sql` 建表,再 `php -S localhost:8000`。

## 部署

推到 `main` 分支即触发 `.github/workflows/deploy.yml`,通过 FTP 增量同步到 InfinityFree 的 `/htdocs/`。

- `doc/**`、`sql/**`、`**.md`、`api/config.php`、`apps/ypwd/website/**` 等**不会**上线(见 workflow 的 `paths-ignore` 与 `exclude`)。
- 所以改文档/SQL不会触发部署;改页面/JS/PHP 才会。
- FTP 凭据放在 GitHub 仓库 Secrets:`FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD`。

## 改动检查清单

提交前确认:

1. 没有把 `api/config.php` 或任何真实凭据加进暂存区。
2. 新埋点事件已加进 `track.php` 的白名单。
3. 纯静态改动在浏览器里点过一遍,没有控制台报错。
4. 文案中文、深色主题风格与现有页面一致。
