import crypto from 'crypto';

/**
 * AES-256-GCM Biometric Template Cryptographic Service
 * 
 * Provides authenticated encryption and decryption for 512-dimensional
 * floating-point biometric feature vectors.
 */

const VECTOR_DIMENSION = 512;
const IV_LENGTH_BYTES = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // Standard 128-bit GCM Auth Tag

/**
 * Resolves and validates the 256-bit encryption key derived from environment secret.
 * @returns {Buffer} 32-byte Key Buffer
 */
function getEncryptionKey() {
    const rawSecret = process.env.FACE_ENCRYPTION_SECRET;
    
    if (!rawSecret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('[FACE CRYPTO FATAL] FACE_ENCRYPTION_SECRET environment variable is missing in production!');
        }
        console.warn('[FACE CRYPTO WARNING] FACE_ENCRYPTION_SECRET not set. Using SHA-256 fallback key for development/testing only.');
        return crypto.createHash('sha256').update('FALLBACK_DEV_FACE_ENCRYPTION_SECRET_DO_NOT_USE_IN_PROD_12345').digest();
    }

    if (rawSecret.length < 16) {
        throw new Error('[FACE CRYPTO ERROR] FACE_ENCRYPTION_SECRET must be at least 16 characters long for security.');
    }

    // Derive strict 32-byte (256-bit) key using SHA-256 digest of secret
    return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypts a 512D Float32Array biometric vector using AES-256-GCM.
 * 
 * @param {Float32Array|number[]} embeddingVector Array of 512 float numbers
 * @returns {Promise<{ encryptedBlob: Buffer, iv: string, authTag: string, vectorDim: number }>}
 */
export async function encryptEmbedding(embeddingVector) {
    if (!embeddingVector || (embeddingVector.length !== VECTOR_DIMENSION && embeddingVector.length !== 128)) {
        throw new Error(`Invalid biometric vector: Expected ${VECTOR_DIMENSION} floats, received ${embeddingVector?.length}`);
    }

    // Convert input to Float32Array if plain array
    const float32Arr = (embeddingVector instanceof Float32Array)
        ? embeddingVector
        : new Float32Array(embeddingVector);

    // Convert Float32Array to Node.js Buffer
    const plainBuffer = Buffer.from(float32Arr.buffer, float32Arr.byteOffset, float32Arr.byteLength);

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encryptedContent = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
        encryptedBlob: encryptedContent,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        vectorDim: float32Arr.length
    };
}

/**
 * Decrypts an AES-256-GCM encrypted BLOB back into a 512D Float32Array.
 * 
 * @param {Buffer|string} encryptedBlob Encrypted Buffer or Hex string
 * @param {string} ivHex 12-byte hex IV string
 * @param {string} authTagHex 16-byte hex auth tag string
 * @returns {Promise<Float32Array>} Decrypted 512D float array
 */
export async function decryptEmbedding(encryptedBlob, ivHex, authTagHex) {
    if (!encryptedBlob || !ivHex || !authTagHex) {
        throw new Error('Encrypted BLOB, IV, and Auth Tag are required for decryption');
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const cipherTextBuffer = Buffer.isBuffer(encryptedBlob) 
        ? encryptedBlob 
        : Buffer.from(encryptedBlob, 'hex');

    if (iv.length !== IV_LENGTH_BYTES) {
        throw new Error(`Invalid IV length: Expected ${IV_LENGTH_BYTES} bytes, received ${iv.length}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
        throw new Error(`Invalid Auth Tag length: Expected ${AUTH_TAG_LENGTH_BYTES} bytes, received ${authTag.length}`);
    }

    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        const decryptedBuffer = Buffer.concat([decipher.update(cipherTextBuffer), decipher.final()]);

        // Reconstruct Float32Array from Buffer
        const float32Array = new Float32Array(
            decryptedBuffer.buffer,
            decryptedBuffer.byteOffset,
            decryptedBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT
        );

        return float32Array;
    } catch (cryptoErr) {
        throw new Error(`Authentication tag validation failed: corrupted or tampered biometric payload (${cryptoErr.message})`);
    }
}

export default {
    encryptEmbedding,
    decryptEmbedding
};
