<?php
/**
 * APK 下载中转脚本
 * 解决 InfinityFree 上手机浏览器下载 APK 只有 1KB 的问题
 * 通过 PHP 直接读取文件并输出二进制流,绕过服务器对 .apk 的限制
 */

$file = __DIR__ . '/download/VideoHelper.apk';

if (!file_exists($file)) {
    http_response_code(404);
    echo '文件不存在';
    exit;
}

$fileSize = filesize($file);
$fileName = '视频助手.apk';

// 清除任何已有的输出缓冲
while (ob_get_level()) {
    ob_end_clean();
}

// 设置下载头
header('Content-Type: application/vnd.android.package-archive');
header('Content-Disposition: attachment; filename="' . $fileName . '"; filename*=UTF-8\'\'' . rawurlencode($fileName));
header('Content-Length: ' . $fileSize);
header('Content-Transfer-Encoding: binary');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// 输出文件
readfile($file);
exit;
