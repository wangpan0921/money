<?php
// 数据库配置（必须和record_download.php中保持一致）
define('DB_HOST', 'sql301.infinityfree.com'); // InfinityFree的数据库主机通常是这个
define('DB_NAME', 'if0_40480405_data_test'); // 你的完整数据库名
define('DB_USER', 'if0_40480405');   // 你的数据库用户名
define('DB_PASS', 'wang15652958821');   // 你的数据库密码

header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $result = $conn->query("SELECT COUNT(*) as total FROM pwd_download_data");
    $row = $result->fetch_assoc();
    echo $row['total'];
    $conn->close();
} catch (Exception $e) {
    echo "0";
}
?>