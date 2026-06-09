# Agent 工坊 · 小应用集

> 一个人 + 一个 Agent，在这间小工坊里做的小东西。每个格子是一个能用的小应用。

这是一个纯静态（HTML/CSS/原生 JS）+ 少量 PHP 的小应用合集，部署在 [InfinityFree](https://infinityfree.net/) 免费虚拟主机上。**没有构建步骤、没有包管理器、没有框架。**

## 应用列表

| 应用 | 路径 | 说明 |
| --- | --- | --- |
| 💰 我今年挣了多少钱 | [`apps/income/`](apps/income/) | 中国个税计算器。支持累计预扣预缴、专项附加扣除、年终奖最优计税、RSU/期权/ESPP。纯前端，数据不上传。 |
| 🔐 我的密码我自己管 | [`apps/ypwd/`](apps/ypwd/) | Android 端小密码管理器的 APK 下载页，附下载计数。 |
| 🔁 Kiro Agent 自动重试脚本 | [`apps/kiro-retry/`](apps/kiro-retry/) | `kiro-cli chat` 的非交互式包装脚本，出错自动重试，可在线查看与下载。 |

主页 [`index.html`](index.html) 是这些应用的导航入口。

## 目录结构

```
.
├── index.html              # 主页:应用导航
├── js/tracker.js           # 共用埋点客户端
├── api/                    # 共用埋点后端 (PHP + MySQL)
│   ├── db.php              # PDO 连接与工具函数
│   ├── track.php           # 埋点写入入口(带事件白名单)
│   ├── stats.php           # 后台统计页(Basic Auth 保护)
│   └── config.example.php  # 配置模板
├── sql/schema.sql          # 数据库建表语句
├── apps/                   # 各小应用
└── .github/workflows/      # 推 main 自动 FTP 部署
```

## 本地运行

纯静态部分，用任意静态服务器即可：

```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

需要测试埋点等 PHP 接口时：

```bash
cp api/config.example.php api/config.php   # 填入本地 MySQL 凭据
# 在 MySQL 中执行 sql/schema.sql 建表
php -S localhost:8000
```

## 部署

推送到 `main` 分支会触发 GitHub Actions（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)），通过 FTP 增量同步到 InfinityFree 的 `/htdocs/`。文档、SQL、`config.php` 等不会上线。FTP 凭据存放在仓库 Secrets（`FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD`）。

## 给 Agent 的说明

如果你是来这里改代码的 AI Agent，请先读 [AGENT.md](AGENT.md)（Claude 用户见 [CLAUDE.md](CLAUDE.md)），里面有工程约定、红线和部署细节。

## 注意

- **不要提交真实凭据。** `api/config.php` 已被 `.gitignore` 忽略，仓库只保留 `config.example.php`。
- 数据库中只记录粗粒度的匿名统计（事件类型、城市/国家、浏览器名+主版本），不记录 IP。
