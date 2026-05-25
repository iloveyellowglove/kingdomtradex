-- ============================================================================
-- KingdomTrade Exchange - Cryptocurrency Trading Platform
-- All balances, trades, and profits are processed in real time.
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ---------------------------------------------------------------------------
-- Users table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','pastor','member') NOT NULL DEFAULT 'member',
  `referral_code` CHAR(8) NOT NULL UNIQUE,
  `referred_by` INT UNSIGNED DEFAULT NULL,
  `display_balance` DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
  `total_deposited_real` DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
  `total_withdrawn_real` DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
  `pending_withdrawal_amount` DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
  `first_deposit_time` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME DEFAULT NULL,
  `status` ENUM('active','suspended','banned') NOT NULL DEFAULT 'active',
  INDEX `idx_referral_code` (`referral_code`),
  INDEX `idx_referred_by` (`referred_by`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Deposits table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deposits` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `txid` VARCHAR(128) NOT NULL COMMENT 'Transaction ID',
  `currency` ENUM('BTC','ETH','USDT') NOT NULL DEFAULT 'USDT',
  `amount` DECIMAL(18,8) NOT NULL,
  `status` ENUM('pending','completed','rejected') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Withdrawals table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(18,8) NOT NULL,
  `currency` ENUM('BTC','ETH','USDT') NOT NULL DEFAULT 'USDT',
  `address` VARCHAR(255) NOT NULL COMMENT 'Crypto address string',
  `fee` DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
  `request_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `eligible_time` DATETIME NOT NULL COMMENT 'When 72h hold expires',
  `processed_time` DATETIME DEFAULT NULL,
  `status` ENUM('pending','processing','completed','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `block_reason` VARCHAR(255) DEFAULT NULL,
  `admin_override` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Admin bypassed the lock',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_eligible_time` (`eligible_time`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Referral commissions (5-level MLM)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referral_commissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'Who receives the commission',
  `source_user_id` INT UNSIGNED NOT NULL COMMENT 'Who made the deposit',
  `level` TINYINT UNSIGNED NOT NULL COMMENT 'Referral depth 1-5',
  `percentage` DECIMAL(5,2) NOT NULL,
  `amount` DECIMAL(18,8) NOT NULL,
  `source_deposit_id` INT UNSIGNED NOT NULL,
  `source_amount` DECIMAL(18,8) NOT NULL COMMENT 'Original deposit amount',
  `status` ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` DATETIME DEFAULT NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_source_user` (`source_user_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`source_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`source_deposit_id`) REFERENCES `deposits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- AI Trading Profits table (daily profit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_trading_profits` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(18,8) NOT NULL,
  `percentage` DECIMAL(5,2) NOT NULL,
  `date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_date` (`user_id`, `date`),
  INDEX `idx_date` (`date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Withdrawal locks (72-hour hold tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawal_locks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `first_deposit_time` DATETIME NOT NULL,
  `lock_expiry_time` DATETIME NOT NULL,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 1,
  `reason` VARCHAR(255) DEFAULT NULL,
  `admin_unlocked_by` INT UNSIGNED DEFAULT NULL,
  `unlocked_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_unlocked_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- System settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(64) NOT NULL UNIQUE,
  `setting_value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Admin audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `target_table` VARCHAR(64) DEFAULT NULL,
  `target_id` INT UNSIGNED DEFAULT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_id` (`admin_id`),
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Default settings
-- ---------------------------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`, `description`) VALUES
('commission_l1', '15.00', 'Level 1 referral commission percentage'),
('commission_l2', '5.00', 'Level 2 referral commission percentage'),
('commission_l3', '3.00', 'Level 3 referral commission percentage'),
('commission_l4', '2.00', 'Level 4 referral commission percentage'),
('commission_l5', '1.00', 'Level 5 referral commission percentage'),
('daily_profit_percentage', '1.50', 'Daily AI trading profit percentage'),
('withdrawal_lock_hours', '72', 'Hours before first withdrawal is allowed'),
('min_deposit_usdt', '10.00', 'Minimum deposit in USDT'),
('min_deposit_btc', '0.001', 'Minimum deposit in BTC'),
('min_deposit_eth', '0.01', 'Minimum deposit in ETH'),
('min_withdrawal_usdt', '10.00', 'Minimum withdrawal in USDT'),
('site_name', 'QuantumTrade Exchange', 'Site display name');

-- Admin user must be created via scripts/create-admin.ts after deployment.
-- See DEPLOYMENT.md for setup instructions.

COMMIT;
