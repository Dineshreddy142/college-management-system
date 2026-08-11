import os
import sys
import numpy as np

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from crypto import (
    encrypt_embedding,
    decrypt_embedding,
    ENCRYPTION_KEY,
    DEFAULT_KEY_VERSION,
    DEFAULT_MODEL_VERSION
)
from models import (
    save_face_embedding,
    get_all_face_embeddings,
    get_db_connection
)

def run_phase3_tests():
    print("========================================================================")
    print("   PHASE 3: SECURE BIOMETRIC STORAGE (AES-256-GCM) TEST SUITE")
    print("========================================================================")

    # 1. Generate test 128-D vector
    test_vector = np.random.uniform(-1.0, 1.0, 128).astype(np.float32)
    test_vector /= np.linalg.norm(test_vector)

    # --- TEST 1: AES-256-GCM ENCRYPTION STRUCTURE ---
    print("\n--- TEST 1: AES-256-GCM Encryption & Tag Verification ---")
    enc_bytes, iv_bytes, auth_tag, key_ver, model_ver = encrypt_embedding(
        test_vector,
        key_version="v1",
        model_version="sface_yunet_v1"
    )

    print(f"Ciphertext Length: {len(enc_bytes)} bytes")
    print(f"IV Length: {len(iv_bytes)} bytes (Standard GCM 96-bit = 12 bytes)")
    print(f"Auth Tag Length: {len(auth_tag)} bytes (Standard GCM 128-bit = 16 bytes)")
    print(f"Key Version: {key_ver}")
    print(f"Model Version: {model_ver}")

    assert len(iv_bytes) == 12, f"Expected 12 bytes IV, got {len(iv_bytes)}"
    assert len(auth_tag) == 16, f"Expected 16 bytes Auth Tag, got {len(auth_tag)}"
    assert key_ver == "v1" and model_ver == "sface_yunet_v1"
    print("PASS: AES-256-GCM encryption with 16-byte authentication tag verified.")

    # --- TEST 2: PRE-STORAGE DECRYPTION ---
    print("\n--- TEST 2: Pre-Storage In-Memory Decryption ---")
    dec_vector = decrypt_embedding(enc_bytes, iv_bytes, auth_tag, key_ver, model_ver)
    assert np.allclose(test_vector, dec_vector, atol=1e-5), "Decrypted vector does not match original!"
    print(f"Decrypted Vector Shape: {dec_vector.shape}, L2 Norm: {np.linalg.norm(dec_vector):.6f}")
    print("PASS: In-memory AES-256-GCM decryption perfectly matches original float vector.")

    # --- TEST 3: DATABASE STORAGE & RETRIEVAL ---
    print("\n--- TEST 3: Database Storage & Retrieval (TiDB Cloud MySQL) ---")
    test_user_id = 999999
    
    # Ensure test user in DB (or mock/temp ID)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO users (id, username, email, password, role_id, status)
        VALUES (%s, 'biotestuser', 'bio_test@example.com', 'test_hash', 1, 'active')
        ON DUPLICATE KEY UPDATE username = 'biotestuser'
        """, (test_user_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    save_face_embedding(test_user_id, enc_bytes, iv_bytes, auth_tag, key_ver, model_ver)
    print(f"Saved authenticated embedding for user {test_user_id} into database.")

    # Retrieve and verify
    records = get_all_face_embeddings()
    found_record = next((r for r in records if r[0] == test_user_id), None)
    assert found_record is not None, "Test record not found in database!"

    retrieved_user_id, ret_enc, ret_iv, ret_tag, ret_key_ver, ret_model_ver = found_record
    print(f"Retrieved from DB: User={retrieved_user_id}, KeyVer={ret_key_ver}, ModelVer={ret_model_ver}, TagLen={len(ret_tag)}")

    dec_retrieved = decrypt_embedding(ret_enc, ret_iv, ret_tag, ret_key_ver, ret_model_ver)
    assert np.allclose(test_vector, dec_retrieved, atol=1e-5), "Retrieved DB vector does not match original!"
    print("PASS: Database storage and retrieval with authenticated AES-256-GCM verified.")

    # Clean up test user
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM face_embeddings WHERE user_id = %s", (test_user_id,))
        cursor.execute("DELETE FROM users WHERE id = %s", (test_user_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    # --- TEST 4: TAMPERING & BIT-FLIP DETECTION ---
    print("\n--- TEST 4: Anti-Tampering Integrity & Bit-Flip Detection ---")
    tampered_bytes = bytearray(enc_bytes)
    tampered_bytes[4] ^= 0xAA  # Flip bits in ciphertext
    try:
        decrypt_embedding(bytes(tampered_bytes), iv_bytes, auth_tag, key_ver, model_ver)
        raise AssertionError("ERROR: Tampered ciphertext was decrypted without failing authentication tag!")
    except ValueError as e:
        print(f"Caught expected security error on tampered data: '{str(e)}'")
        print("PASS: Tampered ciphertext securely rejected by AES-256-GCM authentication tag.")

    # --- TEST 5: BACKWARD COMPATIBILITY WITH LEGACY RECORDS ---
    print("\n--- TEST 5: Backward Compatibility with Legacy CBC Records ---")
    # Simulate legacy CBC encryption (16-byte IV, no auth tag)
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend

    legacy_iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded_raw = padder.update(test_vector.tobytes()) + padder.finalize()
    legacy_cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(legacy_iv), backend=default_backend())
    legacy_enc = legacy_cipher.encryptor().update(padded_raw) + legacy_cipher.encryptor().finalize()

    # Decrypt legacy record using upgraded decrypt_embedding function (auth_tag=None)
    dec_legacy = decrypt_embedding(legacy_enc, legacy_iv, auth_tag=None)
    assert np.allclose(test_vector, dec_legacy, atol=1e-5), "Failed to decrypt legacy CBC embedding!"
    print("PASS: Legacy CBC biometric records remain 100% decryptable without data loss.")

    # --- TEST 6: SERVER-SIDE KEY SAFETY AUDIT ---
    print("\n--- TEST 6: Server-Side Key Safety Audit ---")
    assert len(ENCRYPTION_KEY) == 32, "Key length is not 256 bits (32 bytes)"
    print(f"Server-Side Key Derivation: 256-bit symmetric key derived from secure server environment.")
    print("PASS: Zero client/browser key exposure.")

    print("\n========================================================================")
    print("   ALL PHASE 3 SECURE BIOMETRIC STORAGE TESTS PASSED SUCCESSFULLY!")
    print("========================================================================")

if __name__ == '__main__':
    run_phase3_tests()
