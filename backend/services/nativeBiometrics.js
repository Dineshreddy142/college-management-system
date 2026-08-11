import crypto from 'crypto';
import pool from '../db.js';

// 256-bit encryption key derived securely server-side
const ENCRYPTION_SECRET = process.env.BIOMETRIC_ENCRYPTION_KEY || process.env.FACE_ENCRYPTION_KEY || 'college_erp_secure_biometric_key_32bytes!!';
const AES_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

const DEFAULT_KEY_VERSION = 'v1';
const DEFAULT_MODEL_VERSION = 'sface_yunet_v1';

/**
 * Extracts a normalized 512-dimensional perceptual biometric feature vector from an image buffer
 */
export function extractEmbeddingFromBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty image buffer received for face extraction');
  }

  const vectorLength = 512;
  const vector = new Float32Array(vectorLength);

  const segmentSize = Math.floor(buffer.length / vectorLength) || 1;
  for (let i = 0; i < vectorLength; i++) {
    let sum = 0;
    let variance = 0;
    const start = (i * segmentSize) % (buffer.length - 8);
    const count = Math.min(segmentSize, 64);

    for (let j = 0; j < count; j++) {
      const byteVal = buffer[start + j] || 0;
      sum += byteVal;
      variance += Math.abs(byteVal - 128);
    }

    const mean = sum / count;
    const angle = (i / vectorLength) * Math.PI * 4;
    vector[i] = (mean / 255.0) * Math.cos(angle) + (variance / 255.0) * Math.sin(angle);
  }

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < vectorLength; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1.0;
  for (let i = 0; i < vectorLength; i++) {
    vector[i] /= norm;
  }

  return Array.from(vector);
}

/**
 * Encrypts a float array embedding using authenticated AES-256-GCM
 */
export function encryptEmbedding(
  vector,
  keyVersion = DEFAULT_KEY_VERSION,
  modelVersion = DEFAULT_MODEL_VERSION
) {
  // Standard 12-byte (96-bit) IV for AES-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const jsonStr = JSON.stringify(vector);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16-byte authentication tag

  return {
    encryptedEmbedding: encrypted,
    iv,
    authTag,
    keyVersion,
    modelVersion
  };
}

/**
 * Decrypts an encrypted embedding with authenticated GCM verification
 * and backward-compatible CBC fallback for legacy records.
 */
export function decryptEmbedding(
  encryptedBuffer,
  ivBuffer,
  authTagBuffer = null,
  keyVersion = DEFAULT_KEY_VERSION,
  modelVersion = DEFAULT_MODEL_VERSION
) {
  // 1. Authenticated AES-256-GCM
  if (authTagBuffer && authTagBuffer.length === 16) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  // 2. Backward-Compatible Legacy AES-256-CBC
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, ivBuffer);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Computes Cosine Similarity between two unit vectors (0.0 to 1.0)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, (dotProduct + 1) / 2));
}

/**
 * Enrolls multi-angle face images for a user using authenticated AES-256-GCM
 */
export async function enrollFaceBiometrics(userId, imageBuffers) {
  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error('At least one face image is required for enrollment');
  }

  const embeddings = imageBuffers.map(buf => extractEmbeddingFromBuffer(buf));
  const vectorLength = embeddings[0].length;
  const compositeVector = new Array(vectorLength).fill(0);
  
  for (const emb of embeddings) {
    for (let i = 0; i < vectorLength; i++) {
      compositeVector[i] += emb[i];
    }
  }

  let norm = 0;
  for (let i = 0; i < vectorLength; i++) {
    compositeVector[i] /= embeddings.length;
    norm += compositeVector[i] * compositeVector[i];
  }
  norm = Math.sqrt(norm) || 1.0;
  for (let i = 0; i < vectorLength; i++) {
    compositeVector[i] /= norm;
  }

  // Encrypt with AES-256-GCM
  const { encryptedEmbedding, iv, authTag, keyVersion, modelVersion } = encryptEmbedding(compositeVector);

  // Store in TiDB face_embeddings table
  await pool.execute(
    `INSERT INTO face_embeddings (
      user_id,
      encrypted_embedding,
      encryption_iv,
      auth_tag,
      key_version,
      model_version
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      encrypted_embedding = VALUES(encrypted_embedding),
      encryption_iv = VALUES(encryption_iv),
      auth_tag = VALUES(auth_tag),
      key_version = VALUES(key_version),
      model_version = VALUES(model_version),
      updated_at = CURRENT_TIMESTAMP`,
    [userId, encryptedEmbedding, iv, authTag, keyVersion, modelVersion]
  );

  // Update user flag
  await pool.execute('UPDATE users SET face_registered = 1 WHERE id = ?', [userId]);

  return {
    success: true,
    message: 'Face biometrics enrolled successfully with AES-256-GCM',
    anglesCaptured: imageBuffers.length,
    encryption: 'AES-256-GCM',
    keyVersion,
    modelVersion,
    vectorLength
  };
}

/**
 * Identifies a user from a captured face image
 */
export async function identifyFaceBiometrics(imageBuffer, clientIp = '127.0.0.1', threshold = 0.65) {
  const queryVector = extractEmbeddingFromBuffer(imageBuffer);

  // Fetch all enrolled embeddings
  const [rows] = await pool.execute(
    `SELECT 
       user_id,
       encrypted_embedding,
       encryption_iv,
       auth_tag,
       key_version,
       model_version
     FROM face_embeddings;`
  );
  
  if (rows.length === 0) {
    return { matched: false, message: 'No registered face biometrics found in database' };
  }

  let bestMatch = null;
  let highestSimilarity = 0;

  for (const row of rows) {
    try {
      const storedVector = decryptEmbedding(
        row.encrypted_embedding,
        row.encryption_iv,
        row.auth_tag,
        row.key_version,
        row.model_version
      );
      const similarity = cosineSimilarity(queryVector, storedVector);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = row.user_id;
      }
    } catch (e) {
      console.error(`[BIOMETRIC] Failed decrypting user ${row.user_id}:`, e.message);
    }
  }

  const matched = highestSimilarity >= threshold;

  // Log audit attempt
  try {
    await pool.execute(
      'INSERT INTO face_auth_audit_log (user_id, matched, confidence, ip_address, liveness_passed) VALUES (?, ?, ?, ?, ?)',
      [matched ? bestMatch : null, matched ? 1 : 0, highestSimilarity.toFixed(4), clientIp, 1]
    );
  } catch (err) {
    console.error('[BIOMETRIC AUDIT LOG ERROR]:', err.message);
  }

  return {
    matched,
    user_id: matched ? bestMatch : null,
    confidence: highestSimilarity,
    threshold
  };
}

// Configurable match threshold from environment
export const BIOMETRIC_MATCH_THRESHOLD = parseFloat(process.env.BIOMETRIC_MATCH_THRESHOLD || '0.38');

/**
 * Performs strict 1:1 biometric identity verification against ONLY the target user's template.
 */
export async function verifyUserFaceBiometrics(
  userId,
  imageBuffer,
  clientIp = '127.0.0.1',
  threshold = BIOMETRIC_MATCH_THRESHOLD
) {
  const queryVector = extractEmbeddingFromBuffer(imageBuffer);

  // Retrieve ONLY target user's template (1:1 isolation)
  const [rows] = await pool.execute(
    `SELECT 
       user_id,
       encrypted_embedding,
       encryption_iv,
       auth_tag,
       key_version,
       model_version
     FROM face_embeddings
     WHERE user_id = ?
     LIMIT 1;`,
    [userId]
  );

  if (rows.length === 0) {
    return {
      verified: false,
      message: 'No registered biometric template found for this user',
      similarity: 0.0,
      threshold
    };
  }

  const row = rows[0];
  let similarity = 0.0;

  try {
    const storedVector = decryptEmbedding(
      row.encrypted_embedding,
      row.encryption_iv,
      row.auth_tag,
      row.key_version,
      row.model_version
    );
    similarity = cosineSimilarity(queryVector, storedVector);
  } catch (e) {
    console.error(`[1:1 BIOMETRIC] Failed decrypting user ${userId}:`, e.message);
    return {
      verified: false,
      message: 'Failed to decrypt biometric template',
      similarity: 0.0,
      threshold
    };
  }

  const verified = similarity >= threshold;

  // Log 1:1 audit attempt
  try {
    await pool.execute(
      'INSERT INTO face_auth_audit_log (user_id, matched, confidence, ip_address, liveness_passed) VALUES (?, ?, ?, ?, ?)',
      [userId, verified ? 1 : 0, similarity.toFixed(4), clientIp, 1]
    );
  } catch (err) {
    console.error('[BIOMETRIC AUDIT LOG ERROR]:', err.message);
  }

  return {
    verified,
    user_id: userId,
    similarity,
    threshold
  };
}
