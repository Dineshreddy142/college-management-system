import pool from '../db.js';

async function setupEmailTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS email_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_user_id INT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        notification_type VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'PENDING',
        message_id VARCHAR(255) NULL,
        provider_response TEXT NULL,
        error_message TEXT NULL,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_recipient_email (recipient_email),
        INDEX idx_status (status),
        INDEX idx_notification_type (notification_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [cols] = await pool.execute('DESCRIBE email_notifications');
    console.log('✓ email_notifications table ready with columns:', cols.map(c => c.Field));
    process.exit(0);
  } catch (err) {
    console.error('Error creating email_notifications table:', err);
    process.exit(1);
  }
}

setupEmailTable();
