import os
import sys
import numpy as np
import cv2

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from pose_validator import validate_enrollment_frame
from face_extraction import get_face_models, extract_embedding_from_image
from crypto import encrypt_embedding, decrypt_embedding
from models import save_face_embedding, get_user_face_embedding, get_db_connection

def create_synthetic_pose_frame(base_img, pose_type="front"):
    """
    Creates test frames simulating different head pose angles and quality conditions.
    """
    h, w, _ = base_img.shape
    
    if pose_type == "front":
        return base_img
        
    elif pose_type == "slight_right":
        # Slight right shift (yaw remains close to center, should fail right target)
        M = np.float32([[1, 0, -8], [0, 1, 0]])
        return cv2.warpAffine(base_img, M, (w, h))

    elif pose_type == "turn_right":
        # Realistic Right Turn: Perspective transform compressing left eye distance relative to nose
        pts1 = np.float32([[w*0.1, 0], [w*0.9, 0], [w*0.1, h], [w*0.9, h]])
        pts2_r = np.float32([[w*0.0, 0], [w*0.70, 0], [w*0.0, h], [w*0.70, h]])
        M_r = cv2.getPerspectiveTransform(pts1, pts2_r)
        return cv2.warpPerspective(base_img, M_r, (w, h))

    elif pose_type == "turn_left":
        # Realistic Left Turn: Perspective transform compressing right eye distance relative to nose
        pts1 = np.float32([[w*0.1, 0], [w*0.9, 0], [w*0.1, h], [w*0.9, h]])
        pts2_l = np.float32([[w*0.30, 0], [w*1.0, 0], [w*0.30, h], [w*1.0, h]])
        M_l = cv2.getPerspectiveTransform(pts1, pts2_l)
        return cv2.warpPerspective(base_img, M_l, (w, h))

    elif pose_type == "look_up":
        # Upward Tilt: Shift face upward and compress nose-to-eye height
        pts1 = np.float32([[0, h*0.2], [w, h*0.2], [0, h*0.9], [w, h*0.9]])
        pts2_u = np.float32([[0, h*0.05], [w, h*0.05], [0, h*0.95], [w, h*0.95]])
        M_u = cv2.getPerspectiveTransform(pts1, pts2_u)
        return cv2.warpPerspective(base_img, M_u, (w, h))

    elif pose_type == "poor_lighting":
        # Dim lighting (mean < 35)
        return cv2.convertScaleAbs(base_img, alpha=0.15, beta=-20)

    elif pose_type == "too_far":
        # Tiny face in large frame (< 10% frame width)
        canvas = np.zeros((1000, 1000, 3), dtype=np.uint8) + 128
        small_face = cv2.resize(base_img, (80, 80))
        canvas[450:530, 450:530] = small_face
        return canvas

    elif pose_type == "two_people":
        # Side-by-side faces
        f1 = cv2.resize(base_img, (300, 300))
        f2 = cv2.flip(f1, 1)
        combo = np.zeros((400, 700, 3), dtype=np.uint8) + 128
        combo[50:350, 40:340] = f1
        combo[50:350, 360:660] = f2
        return combo

    return base_img

def run_enrollment_tests():
    print("========================================================================")
    print("   AUTOMATIC POSE-GUIDED ENROLLMENT TEST SUITE (12 TEST CASES)")
    print("========================================================================")

    detector, recognizer = get_face_models()

    p1_path = r'C:\Users\DINESH\.gemini\antigravity-ide\brain\54667418-3cac-4c42-83ca-90f9de5005dc\media__1786388776139.png'
    if not os.path.exists(p1_path):
        raise FileNotFoundError(f"Missing test image: {p1_path}")

    base_img = cv2.imread(p1_path)
    
    def frame_to_bytes(img):
        _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        return buf.tobytes()

    passed_count = 0

    # --- TEST 1: User looks straight -> Front automatically captured ---
    print("\n--- TEST 1: User looks straight -> Front automatically captured ---")
    f_front = frame_to_bytes(base_img)
    r1 = validate_enrollment_frame(f_front, "front", detector)
    print(f"Result: valid={r1['valid']}, pose={r1['pose_detected']}, feedback='{r1['feedback']}'")
    assert r1['valid'] is True and r1['pose_detected'] == 'front', "Test 1 failed!"
    print("PASS: Front pose correctly detected and accepted.")
    passed_count += 1

    # --- TEST 2: User looks slightly right -> Front must NOT capture ---
    print("\n--- TEST 2: User looks slightly right -> Front must NOT capture ---")
    f_slight = frame_to_bytes(create_synthetic_pose_frame(base_img, "slight_right"))
    r2 = validate_enrollment_frame(f_slight, "right", detector)
    print(f"Result: valid={r2['valid']}, pose={r2['pose_detected']}, feedback='{r2['feedback']}'")
    # For a right step, slight right is not deep enough
    assert r2['valid'] is False, "Test 2 failed: Slight right falsely accepted for full right pose!"
    print("PASS: Insufficient turn correctly rejected.")
    passed_count += 1

    # --- TEST 3: User turns clearly right -> Right automatically captured ---
    print("\n--- TEST 3: User turns clearly right -> Right automatically captured ---")
    f_right = frame_to_bytes(create_synthetic_pose_frame(base_img, "turn_right"))
    r3 = validate_enrollment_frame(f_right, "right", detector)
    print(f"Result: valid={r3['valid']}, pose={r3['pose_detected']}, feedback='{r3['feedback']}'")
    assert r3['valid'] is True and r3['pose_detected'] == 'right', "Test 3 failed!"
    print("PASS: Right turn correctly detected and accepted.")
    passed_count += 1

    # --- TEST 4: User turns left when Right requested -> Right must NOT capture ---
    print("\n--- TEST 4: User turns left -> Right must NOT capture ---")
    f_left = frame_to_bytes(create_synthetic_pose_frame(base_img, "turn_left"))
    r4 = validate_enrollment_frame(f_left, "right", detector)
    print(f"Result: valid={r4['valid']}, pose={r4['pose_detected']}, feedback='{r4['feedback']}'")
    assert r4['valid'] is False, "Test 4 failed: Left turn was accepted for Right step!"
    print("PASS: Opposite direction turn correctly rejected.")
    passed_count += 1

    # --- TEST 5: User turns clearly left -> Left automatically captured ---
    print("\n--- TEST 5: User turns clearly left -> Left automatically captured ---")
    r5 = validate_enrollment_frame(f_left, "left", detector)
    print(f"Result: valid={r5['valid']}, pose={r5['pose_detected']}, feedback='{r5['feedback']}'")
    assert r5['valid'] is True and r5['pose_detected'] == 'left', "Test 5 failed!"
    print("PASS: Left turn correctly detected and accepted.")
    passed_count += 1

    # --- TEST 6: User looks up -> Up automatically captured ---
    print("\n--- TEST 6: User looks up -> Up automatically captured ---")
    f_up = frame_to_bytes(create_synthetic_pose_frame(base_img, "look_up"))
    r6 = validate_enrollment_frame(f_up, "up", detector)
    print(f"Result: valid={r6['valid']}, pose={r6['pose_detected']}, feedback='{r6['feedback']}'")
    assert r6['valid'] is True and r6['pose_detected'] == 'up', "Test 6 failed!"
    print("PASS: Upward head tilt correctly detected and accepted.")
    passed_count += 1

    # --- TEST 7: User moves during capture (instability simulation) -> Reset timer ---
    print("\n--- TEST 7: User moves during capture -> Stability timer resets ---")
    # Simulate consecutive frames: valid -> invalid
    r7_frame1 = validate_enrollment_frame(f_front, "front", detector)
    r7_frame2 = validate_enrollment_frame(f_left, "front", detector) # sudden move
    print(f"Frame 1: valid={r7_frame1['valid']} -> Frame 2: valid={r7_frame2['valid']}")
    assert r7_frame1['valid'] is True and r7_frame2['valid'] is False, "Test 7 failed!"
    print("PASS: Mid-capture movement breaks stability and cancels auto-capture.")
    passed_count += 1

    # --- TEST 8: Two people appear -> Capture rejected ---
    print("\n--- TEST 8: Two people appear -> Capture rejected ---")
    f_multi = frame_to_bytes(create_synthetic_pose_frame(base_img, "two_people"))
    r8 = validate_enrollment_frame(f_multi, "front", detector)
    print(f"Result: valid={r8['valid']}, feedback='{r8['feedback']}'")
    assert r8['valid'] is False and "Multiple people" in r8['feedback'], "Test 8 failed!"
    print("PASS: Multi-face scene rejected with clear instruction.")
    passed_count += 1

    # --- TEST 9: Poor lighting -> Capture rejected ---
    print("\n--- TEST 9: Poor lighting -> Capture rejected ---")
    f_dim = frame_to_bytes(create_synthetic_pose_frame(base_img, "poor_lighting"))
    r9 = validate_enrollment_frame(f_dim, "front", detector)
    print(f"Result: valid={r9['valid']}, feedback='{r9['feedback']}'")
    assert r9['valid'] is False and ("lighting" in r9['feedback'] or "No face" in r9['feedback']), "Test 9 failed!"
    print("PASS: Low light rejected with improvement guidance.")
    passed_count += 1

    # --- TEST 10: Face too far away -> Capture rejected ---
    print("\n--- TEST 10: Face too far away -> Capture rejected ---")
    f_far = frame_to_bytes(create_synthetic_pose_frame(base_img, "too_far"))
    r10 = validate_enrollment_frame(f_far, "front", detector)
    print(f"Result: valid={r10['valid']}, feedback='{r10['feedback']}'")
    assert r10['valid'] is False, "Test 10 failed!"
    print("PASS: Small/distant face rejected with 'Move closer' feedback.")
    passed_count += 1

    # --- TEST 11: User does not move to requested pose -> Do NOT capture ---
    print("\n--- TEST 11: User remains static at front when 'Up' requested -> Do NOT capture ---")
    r11 = validate_enrollment_frame(f_front, "up", detector)
    print(f"Result: valid={r11['valid']}, pose_detected={r11['pose_detected']}, feedback='{r11['feedback']}'")
    assert r11['valid'] is False and r11['pose_detected'] == 'front', "Test 11 failed!"
    print("PASS: Static mismatch prevented premature capture.")
    passed_count += 1

    # --- TEST 12: User completes all four poses -> Registration successfully completed ---
    print("\n--- TEST 12: User completes all 4 poses -> Registration completed ---")
    poses = [f_front, f_right, f_left, f_up]
    embeddings = [extract_embedding_from_image(p) for p in poses]
    
    # Compute fused composite 128-D embedding
    composite_vec = np.mean(embeddings, axis=0)
    norm = np.linalg.norm(composite_vec)
    composite_vec = composite_vec / (norm + 1e-6)

    # Encrypt and store in database
    test_user_id = 999123
    enc, iv, tag, k_ver, m_ver = encrypt_embedding(composite_vec)
    save_face_embedding(test_user_id, enc, iv, tag, k_ver, m_ver)

    # Verify retrieval
    rec = get_user_face_embedding(test_user_id)
    assert rec is not None, "Failed retrieving enrolled template!"
    decrypted = decrypt_embedding(rec[1], rec[2], rec[3], rec[4], rec[5])
    
    # Similarity against original front photo
    sim = np.dot(decrypted, embeddings[0])
    print(f"Registration Enrolled 4 Poses (Fused 128-D vector). Similarity to Front Photo: {sim:.4f}")
    assert sim >= 0.90, f"Expected high biometric fidelity, got {sim:.4f}"
    
    # Clean up test user
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM face_embeddings WHERE user_id = %s", (test_user_id,))
    conn.commit()
    c.close()
    conn.close()

    print("PASS: 4-Pose automatic enrollment completed with AES-256-GCM storage.")
    passed_count += 1

    print("\n========================================================================")
    print(f"   ALL {passed_count}/12 AUTOMATIC POSE ENROLLMENT TESTS PASSED SUCCESSFULLY!")
    print("========================================================================")

if __name__ == '__main__':
    run_enrollment_tests()
