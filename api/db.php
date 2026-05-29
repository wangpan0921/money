<?php
declare(strict_types=1);

function load_config(): array {
    $path = __DIR__ . '/config.php';
    if (!file_exists($path)) {
        http_response_code(500);
        exit('config.php missing');
    }
    return require $path;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $cfg = load_config();
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $cfg['host'], $cfg['dbname'], $cfg['charset']
        );
        $pdo = new PDO($dsn, $cfg['user'], $cfg['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function client_ip(): string {
    // 兼容反向代理（InfinityFree 走 Cloudflare 时）
    $candidates = [
        'HTTP_CF_CONNECTING_IP',  // Cloudflare
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR',
    ];
    foreach ($candidates as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = explode(',', $_SERVER[$key])[0];
            $ip = trim($ip);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '0.0.0.0';
}

function clip(?string $value, int $max): ?string {
    if ($value === null) return null;
    return mb_substr($value, 0, $max);
}
