<?php
/**
 * APK 下载中转脚本 v2
 * 使用分块读取 + 逐块刷新,避免 InfinityFree 因内存/执行时间限制截断输出
 */

// 尽可能延长执行时间
@set_time_limit(300);
@ini_set('max_execution_time', 300);

$file = __DIR__ . '/download/VideoHelper.apk';

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

// 关闭输出压缩(InfinityFree 可能默认开启 gzip)
@ini_set('zlib.output_compression', 'Off');

// 设置下载头
header('Content-Type: application/vnd.android.package-archive');
header('Content-Disposition: attachment; filename="VideoHelper.apk"');
header('Content-Length: ' . $fileSize);
header('Content-Transfer-Encoding: binary');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Accept-Ranges: none');

// 分块读取并输出
$handle = fopen($file, 'rb');
if ($handle === false) {
    http_response_code(500);
    exit;
}

$chunkSize = 65536; // 64KB per chunk
while (!feof($handle)) {
    $buffer = fread($handle, $chunkSize);
    if ($buffer === false) {
        break;
    }
    echo $buffer;
    flush();
}

fclose($handle);
exit;
