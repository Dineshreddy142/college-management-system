-- Secure Face Biometric Authentication Database Schema

ALTER TABLE users ADD COLUMN IF NOT EXISTS face_registered TINYINT(1) DEFAULT 0;

CREATE TABLE IF NOT EXISTS face_embeddings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    encrypted_embedding MEDIUMBLOB NOT NULL,
    encryption_iv VARBINARY(16) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_face_embeddings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS face_auth_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    matched TINYINT(1) NOT NULL,
    confidence DECIMAL(5,4) NULL,
    ip_address VARCHAR(45),
    liveness_passed TINYINT(1) NOT NULL,
    INDEX idx_face_audit_user (user_id),
    CONSTRAINT fk_face_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
