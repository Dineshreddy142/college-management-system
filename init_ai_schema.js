import pool from './backend/db.js';

async function initAIDB() {
    try {
        console.log("Creating AI Database tables...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_conversations (
                id VARCHAR(50) PRIMARY KEY,
                user_id INT NOT NULL,
                user_role VARCHAR(20) NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("ai_conversations created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                conversation_id VARCHAR(50) NOT NULL,
                role VARCHAR(10) NOT NULL, -- 'user' or 'model'
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
            );
        `);
        console.log("ai_chat_history created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_user_preferences (
                user_id INT PRIMARY KEY,
                preferred_language VARCHAR(10) DEFAULT 'en',
                voice_enabled BOOLEAN DEFAULT FALSE,
                voice_speed FLOAT DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log("ai_user_preferences created");

        console.log("AI Database Schema Initialized Successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
initAIDB();
