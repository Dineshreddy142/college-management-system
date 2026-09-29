import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import AIProviderFactory from '../services/ai/aiProviderFactory.js';
import { buildSystemPrompt } from '../services/ai/contextService.js';

const router = express.Router();

// Auto-create chat tables if not exist
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_threads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) DEFAULT 'New Conversation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        thread_id INT NOT NULL,
        sender ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        action_data JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (thread_id) REFERENCES ai_chat_threads(id) ON DELETE CASCADE
      )
    `);
    console.log('[AI SERVICE] Chat threads and messages tables verified.');
  } catch (err) {
    console.warn('[AI SERVICE] Table init notice:', err.message);
  }
})();

/**
 * GET /api/ai/threads
 * Fetch user chat threads
 */
router.get('/threads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [threads] = await pool.execute(
      `SELECT id, title, created_at, updated_at 
       FROM ai_chat_threads 
       WHERE user_id = ? 
       ORDER BY updated_at DESC LIMIT 20`,
      [userId]
    );

    return successResponse(res, 'User chat threads fetched successfully', { threads });
  } catch (err) {
    console.error('[AI THREADS GET ERROR]:', err);
    return errorResponse(res, 'Failed to fetch chat threads', [], 500);
  }
});

/**
 * POST /api/ai/threads
 * Create a new chat thread
 */
router.post('/threads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const title = req.body.title || 'New Conversation';

    const [result] = await pool.execute(
      `INSERT INTO ai_chat_threads (user_id, title) VALUES (?, ?)`,
      [userId, title]
    );

    return successResponse(res, 'New chat thread created', {
      threadId: result.insertId,
      title
    });
  } catch (err) {
    console.error('[AI THREAD CREATE ERROR]:', err);
    return errorResponse(res, 'Failed to create chat thread', [], 500);
  }
});

/**
 * GET /api/ai/threads/:threadId/messages
 * Fetch messages for a specific thread
 */
router.get('/threads/:threadId/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    // Verify ownership
    const [tRows] = await pool.execute(
      `SELECT id FROM ai_chat_threads WHERE id = ? AND user_id = ?`,
      [threadId, userId]
    );
    if (tRows.length === 0) {
      return errorResponse(res, 'Thread not found or access denied', [], 404);
    }

    const [messages] = await pool.execute(
      `SELECT id, sender, content, action_data, created_at 
       FROM ai_chat_messages 
       WHERE thread_id = ? 
       ORDER BY id ASC`,
      [threadId]
    );

    return successResponse(res, 'Thread messages fetched', { messages });
  } catch (err) {
    console.error('[AI MESSAGES GET ERROR]:', err);
    return errorResponse(res, 'Failed to fetch messages', [], 500);
  }
});

/**
 * POST /api/ai/chat
 * Primary endpoint for user interaction with AI Copilot
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, threadId: requestedThreadId } = req.body;

    if (!message || !message.trim()) {
      return errorResponse(res, 'Message content cannot be empty', [], 400);
    }

    let threadId = requestedThreadId;

    // Get or Create thread
    if (!threadId) {
      const title = message.trim().substring(0, 35) + (message.length > 35 ? '...' : '');
      const [tRes] = await pool.execute(
        `INSERT INTO ai_chat_threads (user_id, title) VALUES (?, ?)`,
        [userId, title]
      );
      threadId = tRes.insertId;
    } else {
      // Verify thread ownership
      const [tRows] = await pool.execute(
        `SELECT id FROM ai_chat_threads WHERE id = ? AND user_id = ?`,
        [threadId, userId]
      );
      if (tRows.length === 0) {
        return errorResponse(res, 'Chat thread not found', [], 404);
      }
    }

    // Save user message to database
    await pool.execute(
      `INSERT INTO ai_chat_messages (thread_id, sender, content) VALUES (?, 'user', ?)`,
      [threadId, message.trim()]
    );

    // Fetch conversation history for memory context (last 10 messages)
    const [historyRows] = await pool.execute(
      `SELECT sender, content as message 
       FROM ai_chat_messages 
       WHERE thread_id = ? 
       ORDER BY id ASC LIMIT 10`,
      [threadId]
    );

    // Build real-time ERP system context
    const systemPrompt = await buildSystemPrompt(req.user);

    // Call Gemini AI Provider
    const aiProvider = AIProviderFactory.getProvider();
    const rawAiResponse = await aiProvider.generateChatResponse(systemPrompt, historyRows, message.trim());

    // Parse potential JSON action block inside response
    let cleanText = rawAiResponse;
    let actionData = null;

    const jsonMatch = rawAiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        actionData = JSON.parse(jsonMatch[1]);
        cleanText = rawAiResponse.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
      } catch (pe) {}
    }

    // Save assistant message to database
    const [msgResult] = await pool.execute(
      `INSERT INTO ai_chat_messages (thread_id, sender, content, action_data) VALUES (?, 'assistant', ?, ?)`,
      [threadId, cleanText, actionData ? JSON.stringify(actionData) : null]
    );

    // Touch thread updated_at timestamp
    await pool.execute(
      `UPDATE ai_chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [threadId]
    );

    return successResponse(res, 'AI response generated successfully', {
      threadId,
      message: {
        id: msgResult.insertId,
        sender: 'assistant',
        content: cleanText,
        action_data: actionData,
        created_at: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[AI CHAT API ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to process AI chat request', [], 500);
  }
});

/**
 * DELETE /api/ai/threads/:threadId
 * Delete chat thread
 */
router.delete('/threads/:threadId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    const [result] = await pool.execute(
      `DELETE FROM ai_chat_threads WHERE id = ? AND user_id = ?`,
      [threadId, userId]
    );

    return successResponse(res, 'Chat thread deleted', { deleted: result.affectedRows > 0 });
  } catch (err) {
    console.error('[AI THREAD DELETE ERROR]:', err);
    return errorResponse(res, 'Failed to delete chat thread', [], 500);
  }
});

export default router;
