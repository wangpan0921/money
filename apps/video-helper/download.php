<?php
/**
 * APK 下载中转脚本 v3
 *
 * InfinityFree 会拦截/截断 .apk 文件的直接下载。
 * 解决方案：APK 文件以 .zip 后缀存储在服务器上绕过拦截,
 * 由本脚本设置正确的 Content-Type 和文件名后输出完整文件。
 *
 * 使用分块输出 + flush 确保不被执行时间/内存限制截断。
 */

// 尽可能延长执行时间
@set_time_limit(600);
@ini_set('max_execution_time', 600);
@ini_set('memory_limit', '64M');

$file = __DIR__ . '/download/video_helper-0.1.0.apk.zip';
$downloadName = 'video_helper-0.1.0.apk';

if (!file_exists($file)) {
    http_response_code(404);
    echo '文件不存在';
    exit;
}

$fileSize = filesize($file);

// 清除所有输出缓冲
while (ob_get_level()) {
    ob_end_clean();
}

// 关闭输出压缩
@ini_set('zlib.output_compression', 'Off');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}

// 设置下载头
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . $fileSize);
header('Content-Transfer-Encoding: binary');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Accept-Ranges: none');
header('X-Content-Type-Options: nosniff');

// 分块读取并输出(8KB 块更不容易触发内存限制)
$handle = fopen($file, 'rb');
if ($handle === false) {
    http_response_code(500);
    exit;
}

$chunkSize = 8192; // 8KB per chunk
$bytesSent = 0;
while (!feof($handle) && !connection_aborted()) {
    $buffer = fread($handle, $chunkSize);
    if ($buffer === false) {
        break;
    }
    echo $buffer;
    $bytesSent += strlen($buffer);
    flush();
}

fclose($handle);
exit;
