-- 在 InfinityFree 控制台 → phpMyAdmin 中选中你的数据库后执行
CREATE TABLE IF NOT EXISTS usage_events (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_type  VARCHAR(32)  NOT NULL,
    server_ip   VARCHAR(45)  DEFAULT NULL,       -- 不再记录，保留列以兼容
    client_ip   VARCHAR(45)  DEFAULT NULL,       -- 不再记录，保留列以兼容
    country     VARCHAR(64)  DEFAULT NULL,
    region      VARCHAR(64)  DEFAULT NULL,
    city        VARCHAR(64)  DEFAULT NULL,
    user_agent  VARCHAR(64)  DEFAULT NULL,       -- 仅存 "浏览器名 主版本"，如 "Chrome 120"
    referer     VARCHAR(512) DEFAULT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 如果你之前已经按旧 schema 建过表，执行下面这两条来兼容：
-- ALTER TABLE usage_events MODIFY server_ip VARCHAR(45) DEFAULT NULL;
-- ALTER TABLE usage_events MODIFY user_agent VARCHAR(64) DEFAULT NULL;
