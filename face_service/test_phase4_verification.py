import os
import sys
import numpy as np
import cv2

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from biometrics_engine import verify_face_1to1, BIOMETRIC_MATCH_THRESHOLD
from face_extraction import extract_embedding_from_image
from crypto import encrypt_embedding, decrypt_embedding
from models import save_face_embedding, get_user_face_embedding, get_db_connection

def run_phase4_tests():
    print("========================================================================")
    print("   PHASE 4: SECURE 1:1 BIOMETRIC VERIFICATION TEST SUITE")
    print("========================================================================")

    # 1. Prepare Person 1 (Student Face / User A) and Person 2 (Faculty Face / User B)
    p1_path = r'C:\Users\DINESH\.gemini\antigravity-ide\brain\54667418-3cac-4c42-83ca-90f9de5005dc\media__1786388776139.png'
    p2_path = 'face_service/models/lena_test.jpg'

    if not os.path.exists(p1_path) or not os.path.exists(p2_path):
        raise FileNotFoundError("Test image files missing for 1:1 verification suite.")

    with open(p1_path, 'rb') as f:
        img_user_a_bytes = f.read()

    with open(p2_path, 'rb') as f:
        img_user_b_bytes = f.read()

    # Extract Ground Truth Embeddings
    emb_user_a = extract_embedding_from_image(img_user_a_bytes)
    emb_user_b = extract_embedding_from_image(img_user_b_bytes)

    # Setup User A (Student: user_id 888001) and User B (Faculty: user_id 888002) in Database
    student_id = 888001
    faculty_id = 888002

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Seed test users
        cursor.execute("""
        INSERT INTO users (id, username, email, password, role_id, status)
        VALUES 
          (%s, 'student_alice', 'student.alice@college.edu', 'hash_pass', 2, 'active'),
          (%s, 'faculty_bob', 'faculty.bob@college.edu', 'hash_pass', 3, 'active')
        ON DUPLICATE KEY UPDATE status = 'active'
        """, (student_id, faculty_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    # Store User A (Student) template with Person 1 face
    enc_a, iv_a, tag_a, key_a, model_a = encrypt_embedding(emb_user_a)
    save_face_embedding(student_id, enc_a, iv_a, tag_a, key_a, model_a)

    # Store User B (Faculty) template with Person 2 face
    enc_b, iv_b, tag_b, key_b, model_b = encrypt_embedding(emb_user_b)
    save_face_embedding(faculty_id, enc_b, iv_b, tag_b, key_b, model_b)

    print(f"Enrolled Student (ID: {student_id}) with Person 1 Face.")
    print(f"Enrolled Faculty (ID: {faculty_id}) with Person 2 Face.")
    print(f"Configured BIOMETRIC_MATCH_THRESHOLD = {BIOMETRIC_MATCH_THRESHOLD}")

    # Helper function simulating 1:1 backend verification
    def perform_1to1_verification(target_user_id, live_face_bytes):
        # 1. Extract live embedding
        live_emb = extract_embedding_from_image(live_face_bytes)
        
        # 2. Retrieve ONLY target user's template (1:1 isolation)
        record = get_user_face_embedding(target_user_id)
        if not record:
            return False, 0.0, "Template not found"
        
        _, enc, iv, tag, k_ver, m_ver = record
        stored_emb = decrypt_embedding(enc, iv, tag, k_ver, m_ver)

        # 3. Compare 1:1
        res = verify_face_1to1(live_emb, stored_emb)
        return res["verified"], res["similarity"], "OK"

    # --- TEST 1: User A Email + User A Face -> PASS ---
    print("\n--- TEST 1: User A Email (Student) + User A Face -> PASS ---")
    verified1, sim1, msg1 = perform_1to1_verification(student_id, img_user_a_bytes)
    print(f"Result: verified={verified1}, similarity={sim1:.4f} (Threshold >= {BIOMETRIC_MATCH_THRESHOLD})")
    assert verified1 is True and sim1 >= BIOMETRIC_MATCH_THRESHOLD, f"Expected PASS for User A match, got {sim1}"
    print("PASS: User A successfully verified against User A account.")

    # --- TEST 2: User A Email + User B Face -> FAIL ---
    print("\n--- TEST 2: User A Email (Student) + User B Face (Imposter) -> FAIL ---")
    verified2, sim2, msg2 = perform_1to1_verification(student_id, img_user_b_bytes)
    print(f"Result: verified={verified2}, similarity={sim2:.4f} (Must be < {BIOMETRIC_MATCH_THRESHOLD})")
    assert verified2 is False and sim2 < BIOMETRIC_MATCH_THRESHOLD, f"Expected FAIL for User B imposter on User A account, got {sim2}"
    print("PASS: User B imposter correctly rejected on User A account.")

    # --- TEST 3: Student Email + Faculty Face -> FAIL ---
    print("\n--- TEST 3: Student Email + Faculty Face -> FAIL ---")
    verified3, sim3, msg3 = perform_1to1_verification(student_id, img_user_b_bytes)
    print(f"Result: verified={verified3}, similarity={sim3:.4f}")
    assert verified3 is False, "Faculty face was falsely accepted on Student account!"
    print("PASS: Faculty face correctly rejected on Student email.")

    # --- TEST 4: Faculty Email + Student Face -> FAIL ---
    print("\n--- TEST 4: Faculty Email + Student Face -> FAIL ---")
    verified4, sim4, msg4 = perform_1to1_verification(faculty_id, img_user_a_bytes)
    print(f"Result: verified={verified4}, similarity={sim4:.4f}")
    assert verified4 is False, "Student face was falsely accepted on Faculty account!"
    print("PASS: Student face correctly rejected on Faculty email.")

    # Clean up test accounts
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM face_embeddings WHERE user_id IN (%s, %s)", (student_id, faculty_id))
        cursor.execute("DELETE FROM users WHERE id IN (%s, %s)", (student_id, faculty_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    print("\n========================================================================")
    print("   ALL 4 PHASE 4 1:1 BIOMETRIC VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("========================================================================")

if __name__ == '__main__':
    run_phase4_tests()
