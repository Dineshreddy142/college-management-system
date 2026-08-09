import os
import json
import numpy as np
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

# 256-bit Secret Key for Biometric AES Encryption
# Derived from environment or fallback secure static key
SECRET_KEY_STR = os.getenv("FACE_ENCRYPTION_KEY", "EduERP_Secure_Biometric_AES256_Secret_Key_2026!")
# Ensure key length is exactly 32 bytes (256 bits)
ENCRYPTION_KEY = SECRET_KEY_STR.encode("utf-8").ljust(32, b'\0')[:32]

def encrypt_embedding(embedding_array):
    """
    Encrypts a 128-d / N-d floating point numpy array of embedding values using AES-256-CBC.
    Returns: (encrypted_bytes, iv_bytes)
    """
    if isinstance(embedding_array, np.ndarray):
        vec_list = embedding_array.tolist()
    else:
        vec_list = list(embedding_array)

    json_str = json.dumps(vec_list)
    raw_bytes = json_str.encode('utf-8')

    # Generate 16-byte random Initialization Vector (IV)
    iv = os.urandom(16)

    # Pad data to 128-bit block boundary
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(raw_bytes) + padder.finalize()

    # Create Cipher
    cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    return ciphertext, iv

def decrypt_embedding(ciphertext, iv):
    """
    Decrypts AES-256-CBC ciphertext and returns numpy float array of embedding values.
    """
    cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()

    # Unpad data
    unpadder = padding.PKCS7(128).unpadder()
    raw_bytes = unpadder.update(padded_data) + unpadder.finalize()

    json_str = raw_bytes.decode('utf-8')
    vec_list = json.loads(json_str)

    return np.array(vec_list, dtype=np.float32)
