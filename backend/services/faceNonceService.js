import crypto from 'crypto';

/**
 * Abstract Interface for Nonce Storage Strategy
 */
export class INonceStore {
    async createNonce(transactionId, action, metadata) {
        throw new Error('Method createNonce() must be implemented');
    }

    async consumeNonce(nonceString) {
        throw new Error('Method consumeNonce() must be implemented');
    }

    async purgeExpired() {
        throw new Error('Method purgeExpired() must be implemented');
    }
}

/**
 * Single-Instance In-Memory Nonce Store Implementation
 * Suitable for single-instance development and testing.
 * Designed to be swappable with Redis/Shared DB for multi-instance clusters.
 */
export class InMemoryNonceStore extends INonceStore {
    constructor(ttlMs = 15000) {
        super();
        this.ttlMs = ttlMs;
        this.store = new Map(); // nonce -> { nonce, transactionId, action, metadata, createdAt, expiresAt }

        // Periodic cleanup interval every 30 seconds
        this.cleanupInterval = setInterval(() => {
            this.purgeExpired();
        }, 30000);

        // Allow process to exit cleanly without unref issues in testing
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Generates a 256-bit cryptographically random single-use nonce.
     * 
     * @param {string} transactionId Associated transaction ID
     * @param {string} action Action constraint (e.g. 'FACE_LOGIN', 'FACE_ENROLL')
     * @param {object} metadata Additional challenge metadata
     * @returns {Promise<{ nonce: string, transactionId: string, action: string, expiresAt: number, ttlMs: number }>}
     */
    async createNonce(transactionId = null, action = 'FACE_LOGIN', metadata = {}) {
        const nonceHex = crypto.randomBytes(32).toString('hex'); // 64 hex chars
        const txId = transactionId || `tx_${crypto.randomBytes(12).toString('hex')}`;
        const now = Date.now();
        const expiresAt = now + this.ttlMs;

        const entry = {
            nonce: nonceHex,
            transactionId: txId,
            action,
            metadata,
            createdAt: now,
            expiresAt
        };

        this.store.set(nonceHex, entry);

        return {
            nonce: nonceHex,
            transactionId: txId,
            action,
            expiresAt,
            ttlMs: this.ttlMs
        };
    }

    /**
     * Atomically validates and consumes a single-use nonce.
     * Re-submitting an already consumed nonce will return valid = false (Replay Protection).
     * 
     * @param {string} nonceString Nonce hex string to consume
     * @returns {Promise<{ valid: boolean, reason?: string, transactionId?: string, action?: string, metadata?: object }>}
     */
    async consumeNonce(nonceString) {
        if (!nonceString || typeof nonceString !== 'string') {
            return { valid: false, reason: 'INVALID_NONCE_FORMAT' };
        }

        const entry = this.store.get(nonceString);

        if (!entry) {
            return { valid: false, reason: 'NONCE_NOT_FOUND' };
        }

        // Immediately delete from memory (Single-Use Rule)
        this.store.delete(nonceString);

        if (Date.now() > entry.expiresAt) {
            return { valid: false, reason: 'NONCE_EXPIRED' };
        }

        return {
            valid: true,
            transactionId: entry.transactionId,
            action: entry.action,
            metadata: entry.metadata
        };
    }

    /**
     * Purges all expired nonces from memory.
     */
    async purgeExpired() {
        const now = Date.now();
        for (const [nonce, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(nonce);
            }
        }
    }

    /**
     * Stops the background cleanup timer (useful for test teardown).
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.store.clear();
    }
}

// Default exported singleton instance using InMemoryNonceStore (15s TTL)
export const faceNonceService = new InMemoryNonceStore(15000);

export default faceNonceService;
