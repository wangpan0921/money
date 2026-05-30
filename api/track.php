<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '{}', true);
if (!is_array($payload)) $payload = [];

$allowed = [
    // income 子应用
    'calculate', 'export_image', 'save_local',
    // 主页
    'home_view',
    'home_click_income',
    'home_click_ypwd',
];
$type = $payload['event_type'] ?? '';
if (!in_array($type, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid event_type']);
    exit;
}

try {
    $stmt = db()->prepare(
        'INSERT INTO usage_events
         (event_type, server_ip, client_ip, country, region, city, user_agent, referer)
         VALUES (:type, NULL, NULL, :country, :region, :city, :ua, :ref)'
    );
    $stmt->execute([
        ':type'    => $type,
        ':country' => clip($payload['country']      ?? null, 64),
        ':region'  => clip($payload['region']       ?? null, 64),
        ':city'    => clip($payload['city']         ?? null, 64),
        ':ua'      => simplify_ua($_SERVER['HTTP_USER_AGENT'] ?? null),
        ':ref'     => clip($_SERVER['HTTP_REFERER']    ?? null, 512),
    ]);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    // 不向前端泄漏细节
    http_response_code(500);
    error_log('[track] ' . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'server error']);
}

/**
 * 把完整 User-Agent 简化成 "浏览器名 主版本号"，去除指纹信息。
 * 例: "Mozilla/5.0 ... Chrome/120.0.0.0 Safari/537.36" → "Chrome 120"
 */
function simplify_ua(?string $ua): ?string {
    if (!$ua) return null;
    // 顺序敏感：Edge / Opera 的 UA 同时包含 Chrome 关键字，必须先匹配
    $patterns = [
        '/Edg\/(\d+)/'                  => 'Edge',
        '/OPR\/(\d+)/'                  => 'Opera',
        '/Firefox\/(\d+)/'              => 'Firefox',
        '/Chrome\/(\d+)/'               => 'Chrome',
        '/Version\/(\d+)[\d.]* Safari/' => 'Safari',
    ];
    foreach ($patterns as $re => $name) {
        if (preg_match($re, $ua, $m)) {
            return $name . ' ' . $m[1];
        }
    }
    return 'Other';
}
