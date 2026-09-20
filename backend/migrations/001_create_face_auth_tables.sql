-- Phase 1 Migration: Biometric Face-Authentication Tables for EduERP
-- Database Engine: MySQL 8.0+ / MariaDB / TiDB Compatible
-- Idempotent script: Safe to execute repeatedly

USE college_management_system;

-- 1. Encrypted Biometric Templates Table
CREATE TABLE IF NOT EXISTS user_face_biometrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    encrypted_embedding LONGBLOB NOT NULL,
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    algorithm_version VARCHAR(50) NOT NULL DEFAULT 'arcface-mobilefacenet-v1',
    vector_dim INT NOT NULL DEFAULT 512,
    quality_score FLOAT DEFAULT 0.0,
    status ENUM('active', 'disabled', 'revoked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Audit Event Table (Strictly No Raw Biometrics or Passwords Logged)
CREATE TABLE IF NOT EXISTS face_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    identifier VARCHAR(100) NULL,
    event_type ENUM(
        'FACE_ENROLLMENT_SUCCESS',
        'FACE_ENROLLMENT_FAILURE',
        'FACE_LOGIN_SUCCESS',
        'FACE_LOGIN_FAILURE',
        'FACE_LOGIN_RATE_LIMITED',
        'FACE_DISABLED',
        'FACE_RE_ENROLLED',
        'FACE_SERVICE_ERROR'
    ) NOT NULL,
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    failure_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_face_audit_user (user_id),
    INDEX idx_face_audit_event (event_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Decoupled Face Rate Limiting Throttling Table
CREATE TABLE IF NOT EXISTS face_failed_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    failed_count INT DEFAULT 1,
    lockout_until DATETIME NULL,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_face_failed_id (identifier)
);
