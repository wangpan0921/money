<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$cfg = load_config();
$user = $_SERVER['PHP_AUTH_USER'] ?? '';
$pass = $_SERVER['PHP_AUTH_PW']   ?? '';
if ($user !== $cfg['stats_user'] || !hash_equals($cfg['stats_password'], $pass)) {
    header('WWW-Authenticate: Basic realm="Stats"');
    http_response_code(401);
    exit('Auth required');
}

$pdo = db();

$summary = $pdo->query(
    "SELECT event_type, COUNT(*) AS n
     FROM usage_events
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY event_type
     ORDER BY n DESC"
)->fetchAll();

$daily = $pdo->query(
    "SELECT DATE(created_at) AS d, event_type, COUNT(*) AS n
     FROM usage_events
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
     GROUP BY d, event_type
     ORDER BY d DESC, event_type"
)->fetchAll();

$cities = $pdo->query(
    "SELECT IFNULL(NULLIF(city,''),'(unknown)') AS city,
            IFNULL(NULLIF(country,''),'(unknown)') AS country,
            COUNT(*) AS n
     FROM usage_events
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY city, country
     ORDER BY n DESC
     LIMIT 30"
)->fetchAll();

$browsers = $pdo->query(
    "SELECT IFNULL(NULLIF(user_agent,''),'(unknown)') AS ua, COUNT(*) AS n
     FROM usage_events
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY ua
     ORDER BY n DESC
     LIMIT 20"
)->fetchAll();

$recent = $pdo->query(
    "SELECT created_at, event_type, city, country, user_agent
     FROM usage_events
     ORDER BY id DESC
     LIMIT 50"
)->fetchAll();

function h($v): string {
    return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>使用统计</title>
<style>
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background:#0e1116; color:#e6edf3; margin:0; padding:20px; }
  h2 { border-bottom:1px solid #2a3340; padding-bottom:8px; margin-top:32px; }
  table { border-collapse:collapse; width:100%; margin-top:8px; font-size:13px; }
  th,td { border:1px solid #2a3340; padding:6px 10px; text-align:left; }
  th { background:#1c232c; }
  tr:nth-child(even) td { background:#161b22; }
  .muted { color:#8b949e; font-size:12px; }
  code { background:#1c232c; padding:2px 5px; border-radius:3px; }
</style>
</head>
<body>
<h1>使用统计</h1>
<p class="muted">生成时间 <?= h(date('Y-m-d H:i:s')) ?></p>

<h2>近 7 天事件汇总</h2>
<table>
  <tr><th>事件类型</th><th>次数</th></tr>
  <?php foreach ($summary as $r): ?>
    <tr><td><code><?= h($r['event_type']) ?></code></td><td><?= h($r['n']) ?></td></tr>
  <?php endforeach; if (!$summary): ?>
    <tr><td colspan="2" class="muted">暂无数据</td></tr>
  <?php endif; ?>
</table>

<h2>近 14 天每日</h2>
<table>
  <tr><th>日期</th><th>事件</th><th>次数</th></tr>
  <?php foreach ($daily as $r): ?>
    <tr><td><?= h($r['d']) ?></td><td><code><?= h($r['event_type']) ?></code></td><td><?= h($r['n']) ?></td></tr>
  <?php endforeach; ?>
</table>

<h2>近 30 天 Top 城市</h2>
<table>
  <tr><th>城市</th><th>国家</th><th>事件数</th></tr>
  <?php foreach ($cities as $r): ?>
    <tr>
      <td><?= h($r['city']) ?></td>
      <td><?= h($r['country']) ?></td>
      <td><?= h($r['n']) ?></td>
    </tr>
  <?php endforeach; ?>
</table>

<h2>近 30 天浏览器分布</h2>
<table>
  <tr><th>浏览器</th><th>事件数</th></tr>
  <?php foreach ($browsers as $r): ?>
    <tr><td><?= h($r['ua']) ?></td><td><?= h($r['n']) ?></td></tr>
  <?php endforeach; ?>
</table>

<h2>最近 50 条</h2>
<table>
  <tr><th>时间</th><th>事件</th><th>城市</th><th>国家</th><th>浏览器</th></tr>
  <?php foreach ($recent as $r): ?>
    <tr>
      <td><?= h($r['created_at']) ?></td>
      <td><code><?= h($r['event_type']) ?></code></td>
      <td><?= h($r['city']) ?></td>
      <td><?= h($r['country']) ?></td>
      <td class="muted"><?= h($r['user_agent']) ?></td>
    </tr>
  <?php endforeach; ?>
</table>

</body>
</html>
