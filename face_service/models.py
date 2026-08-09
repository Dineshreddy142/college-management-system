import os
import mysql.connector

def get_db_connection():
    """
    Establishes connection to MySQL database using environment variables or defaults.
    """
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", os.getenv("DB_PASSWORD", "WJ28@krhps")),
        database=os.getenv("DB_NAME", "college_management_system"),
        port=int(os.getenv("DB_PORT", "3306"))
    )

def save_face_embedding(user_id, encrypted_bytes, iv_bytes):
    """
    Inserts or updates the encrypted face embedding for user_id in MySQL.
    Also updates users.face_registered = 1.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
        INSERT INTO face_embeddings (user_id, encrypted_embedding, encryption_iv)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            encrypted_embedding = VALUES(encrypted_embedding),
            encryption_iv = VALUES(encryption_iv),
            updated_at = CURRENT_TIMESTAMP
        """
        cursor.execute(sql, (user_id, encrypted_bytes, iv_bytes))

        # Set face_registered flag in users table
        cursor.execute("UPDATE users SET face_registered = 1 WHERE id = %s", (user_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_all_face_embeddings():
    """
    Retrieves all stored face embeddings from MySQL.
    Returns list of tuples: [(user_id, encrypted_bytes, iv_bytes), ...]
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = "SELECT user_id, encrypted_embedding, encryption_iv FROM face_embeddings"
        cursor.execute(sql)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def log_auth_attempt(user_id, matched, confidence, ip_address, liveness_passed):
    """
    Records a biometric authentication attempt in face_auth_audit_log table.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
        INSERT INTO face_auth_audit_log (user_id, matched, confidence, ip_address, liveness_passed)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (user_id, 1 if matched else 0, confidence, ip_address, 1 if liveness_passed else 0))
        conn.commit()
    except Exception as e:
        print(f"[FACE_SERVICE] Failed to log auth attempt: {e}")
    finally:
        cursor.close()
        conn.close()
