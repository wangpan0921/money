<?php
/**
 * 悬浮时钟 APK 下载中转脚本
 *
 * InfinityFree 会拦截或截断 .apk 文件的直接下载，因此仓库中以
 * .apk.zip 后缀保存原始 APK 字节，再由本脚本以 APK 文件名输出。
 */

@set_time_limit(600);
@ini_set('max_execution_time', 600);
@ini_set('memory_limit', '64M');

$file = __DIR__ . '/download/floating-clock-standard-v1.0-release.apk.zip';
$downloadName = 'floating-clock-standard-v1.0-release.apk';

if (!file_exists($file)) {
    http_response_code(404);
    echo '文件不存在';
    exit;
}

$fileSize = filesize($file);

while (ob_get_level()) {
    ob_end_clean();
}

@ini_set('zlib.output_compression', 'Off');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}

header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . $fileSize);
header('Content-Transfer-Encoding: binary');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Accept-Ranges: none');
header('X-Content-Type-Options: nosniff');

$handle = fopen($file, 'rb');
if ($handle === false) {
    http_response_code(500);
    exit;
}

$chunkSize = 8192;
while (!feof($handle) && !connection_aborted()) {
    $buffer = fread($handle, $chunkSize);
    if ($buffer === false) {
        break;
    }
    echo $buffer;
    flush();
}

fclose($handle);
exit;
