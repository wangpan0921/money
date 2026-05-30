<?php
header('Content-Type: text/plain'); // 设置返回纯文本，方便前端处理
header('Access-Control-Allow-Origin: *'); // 允许前端跨域调用（如果网页和API同域可省略）

// ==== 数据库配置（必须修改！）====
// 以下信息请在InfinityFree的cPanel中查找
define('DB_HOST', 'sql301.infinityfree.com'); // InfinityFree的数据库主机通常是这个
define('DB_NAME', 'if0_40480405_data_test'); // 你的完整数据库名
define('DB_USER', 'if0_40480405');   // 你的数据库用户名
define('DB_PASS', 'wang15652958821');   // 你的数据库密码
// ===============================

// 获取客户端IP地址（更可靠的方法）
function getClientIP() {
    $ip = '';
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

try {
    // 1. 连接数据库
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("数据库连接失败: " . $conn->connect_error);
    }
    // 2. 准备SQL插入语句（使用预处理语句防止SQL注入）
    $sql = "INSERT INTO pwd_download_data (download_time, ip_address) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("SQL语句准备失败: " . $conn->error);
    }
    // 3. 绑定参数并执行
    $currentTime = date('Y-m-d H:i:s'); // 生成当前时间的标准SQL格式
    $ip = getClientIP();
    $stmt->bind_param("ss", $currentTime, $ip);

    if ($stmt->execute()) {
        // 插入成功后，查询总下载次数返回给前端
        $countResult = $conn->query("SELECT COUNT(*) as total FROM pwd_download_data");
        $countRow = $countResult->fetch_assoc();
        echo $countRow['total']; // 输出总下载数
    } else {
        throw new Exception("记录插入失败: " . $stmt->error);
    }

    // 4. 关闭连接
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    // 错误处理（生产环境中建议记录到日志文件，而不是直接输出）
    error_log("Download Logger Error [" . date('Y-m-d H:i:s') . "]: " . $e->getMessage()); // 记录到服务器错误日志
    echo "Error"; // 向前端返回简单错误信息
}
?>