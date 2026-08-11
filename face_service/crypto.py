import os
import json
import numpy as np
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidTag

# 256-bit Secret Key for Biometric AES Encryption (Derived securely server-side)
SECRET_KEY_STR = os.getenv("FACE_ENCRYPTION_KEY", os.getenv("BIOMETRIC_ENCRYPTION_KEY", "EduERP_Secure_Biometric_AES256_Secret_Key_2026!"))
ENCRYPTION_KEY = SECRET_KEY_STR.encode("utf-8").ljust(32, b'\0')[:32]

DEFAULT_KEY_VERSION = "v1"
DEFAULT_MODEL_VERSION = "sface_yunet_v1"

def encrypt_embedding(
    embedding_array,
    key_version: str = DEFAULT_KEY_VERSION,
    model_version: str = DEFAULT_MODEL_VERSION
):
    """
    Encrypts a floating point numpy array of embedding values using authenticated AES-256-GCM.
    
    Returns:
      (ciphertext: bytes, iv: bytes, auth_tag: bytes, key_version: str, model_version: str)
    """
    arr = np.asarray(embedding_array, dtype=np.float32).flatten()
    raw_bytes = arr.tobytes()

    # Standard 12-byte (96-bit) cryptographically random IV for AES-GCM
    iv = os.urandom(12)

    # Initialize AES-256-GCM Cipher
    cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(raw_bytes) + encryptor.finalize()
    auth_tag = encryptor.tag  # 16-byte authentication tag

    return ciphertext, iv, auth_tag, key_version, model_version

def decrypt_embedding(
    ciphertext: bytes,
    iv: bytes,
    auth_tag: bytes = None,
    key_version: str = DEFAULT_KEY_VERSION,
    model_version: str = DEFAULT_MODEL_VERSION
) -> np.ndarray:
    """
    Decrypts biometric embedding.
    Supports authenticated AES-256-GCM when auth_tag is present,
    with backward-compatible fallback to AES-256-CBC for legacy database records.
    """
    # 1. Authenticated AES-256-GCM Decryption
    if auth_tag is not None and len(auth_tag) == 16:
        try:
            cipher = Cipher(
                algorithms.AES(ENCRYPTION_KEY),
                modes.GCM(bytes(iv), bytes(auth_tag)),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            raw_bytes = decryptor.update(bytes(ciphertext)) + decryptor.finalize()
            return np.frombuffer(raw_bytes, dtype=np.float32)
        except InvalidTag:
            raise ValueError("Biometric Authentication Tag Verification Failed: Data ciphertext has been tampered with or corrupted.")

    # 2. Backward-Compatible Legacy AES-256-CBC Decryption
    try:
        cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(bytes(iv)), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(bytes(ciphertext)) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        raw_bytes = unpadder.update(padded_data) + unpadder.finalize()

        if raw_bytes.startswith(b'[') or raw_bytes.startswith(b'{'):
            json_str = raw_bytes.decode('utf-8')
            vec_list = json.loads(json_str)
            return np.array(vec_list, dtype=np.float32)

        return np.frombuffer(raw_bytes, dtype=np.float32)
    except Exception as e:
        raise ValueError(f"Failed to decrypt legacy biometric embedding: {str(e)}")
