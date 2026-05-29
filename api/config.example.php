<?php
// 复制本文件为 config.php，填入 InfinityFree 控制台的 MySQL 凭据
// MySQL Databases 页面可以看到：主机名、数据库名、用户名、密码

return [
    'host'     => 'sqlXXX.infinityfree.com',  // 改成你的 host
    'dbname'   => 'if0_XXXXXXXX_money',       // 改成你的库名
    'user'     => 'if0_XXXXXXXX',             // 改成你的用户名
    'password' => 'YOUR_DB_PASSWORD',         // 改成你的密码
    'charset'  => 'utf8mb4',

    // 后台 stats.php 使用 HTTP Basic Auth 保护
    'stats_user'     => 'admin',
    'stats_password' => 'CHANGE_ME_TO_A_STRONG_PASSWORD',
];
