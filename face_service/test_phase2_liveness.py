import os
import sys
import time
import cv2
import numpy as np

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from liveness import (
    create_liveness_challenge,
    verify_liveness_challenge,
    CHALLENGE_STORE,
    CHALLENGE_DEFINITIONS
)
from face_extraction import get_face_models

def run_phase2_tests():
    print("========================================================================")
    print("   PHASE 2: ACTIVE LIVENESS CHALLENGE-RESPONSE TEST SUITE")
    print("========================================================================")

    detector, _ = get_face_models()

    # Load baseline face test image
    img1_path = r'C:\Users\DINESH\.gemini\antigravity-ide\brain\54667418-3cac-4c42-83ca-90f9de5005dc\media__1786388776139.png'
    if not os.path.exists(img1_path):
        raise FileNotFoundError(f"Test image not found: {img1_path}")

    base_img = cv2.imread(img1_path)
    h, w, _ = base_img.shape

    # Helper to encode images
    def to_bytes(img):
        _, buf = cv2.imencode('.jpg', img)
        return buf.tobytes()

    # Create synthetic variations representing actions:
    # Action A: Turn Left (shift face to right side of frame or rotate)
    img_left = np.zeros_like(base_img)
    img_left[:, 30:] = base_img[:, :-30]

    # Action B: Turn Right (shift face to left side of frame)
    img_right = np.zeros_like(base_img)
    img_right[:, :-30] = base_img[:, 30:]

    # Action C: Blank / No face image
    img_blank = np.zeros((480, 640, 3), dtype=np.uint8) + 20

    # Action D: Multi-face image (side-by-side duplicate faces)
    img_multi = np.zeros((h, w * 2, 3), dtype=np.uint8)
    img_multi[:, :w] = base_img
    img_multi[:, w:] = base_img

    # --- TEST 1: CORRECT CHALLENGE -> PASS ---
    print("\n--- TEST 1: Correct Challenge Execution -> PASS ---")
    challenge_data = create_liveness_challenge()
    session_id = challenge_data["session_id"]
    # Force challenge to turn_left for deterministic test
    CHALLENGE_STORE[session_id]["challenge"] = "turn_left"
    CHALLENGE_STORE[session_id]["expected_action"] = "yaw_left"

    frames_pass = [to_bytes(base_img), to_bytes(img_left)]
    passed, msg, meta = verify_liveness_challenge(session_id, frames_pass, detector)
    print(f"Result: passed={passed}, message='{msg}'")
    assert passed is True, f"Expected PASS for valid challenge execution, got {msg}"
    print("PASS: Valid challenge execution successfully verified.")

    # --- TEST 2: WRONG CHALLENGE -> FAIL ---
    print("\n--- TEST 2: Wrong Challenge Execution -> FAIL ---")
    challenge_data2 = create_liveness_challenge()
    session_id2 = challenge_data2["session_id"]
    CHALLENGE_STORE[session_id2]["challenge"] = "turn_right"
    CHALLENGE_STORE[session_id2]["expected_action"] = "yaw_right"

    # User performs Left turn instead of Right turn
    frames_wrong = [to_bytes(base_img), to_bytes(img_left)]
    passed2, msg2, meta2 = verify_liveness_challenge(session_id2, frames_wrong, detector)
    print(f"Result: passed={passed2}, message='{msg2}'")
    assert passed2 is False, f"Expected FAIL for wrong action, but got PASS"
    print("PASS: Mismatched challenge action correctly rejected.")

    # --- TEST 3: NO FACE IN FRAME -> FAIL ---
    print("\n--- TEST 3: No Face in Frame -> FAIL ---")
    challenge_data3 = create_liveness_challenge()
    session_id3 = challenge_data3["session_id"]

    frames_noface = [to_bytes(img_blank)]
    passed3, msg3, meta3 = verify_liveness_challenge(session_id3, frames_noface, detector)
    print(f"Result: passed={passed3}, message='{msg3}'")
    assert passed3 is False, f"Expected FAIL for no face, but got PASS"
    print("PASS: Blank / no-face frame correctly rejected.")

    # --- TEST 4: MULTIPLE FACES -> FAIL ---
    print("\n--- TEST 4: Multiple Faces Detected -> FAIL ---")
    challenge_data4 = create_liveness_challenge()
    session_id4 = challenge_data4["session_id"]

    frames_multi = [to_bytes(img_multi)]
    passed4, msg4, meta4 = verify_liveness_challenge(session_id4, frames_multi, detector)
    print(f"Result: passed={passed4}, message='{msg4}'")
    assert passed4 is False, f"Expected FAIL for multi-face, but got PASS"
    print("PASS: Multi-face scene correctly rejected.")

    # --- TEST 5: EXPIRED CHALLENGE -> FAIL ---
    print("\n--- TEST 5: Expired Challenge Session -> FAIL ---")
    challenge_data5 = create_liveness_challenge()
    session_id5 = challenge_data5["session_id"]
    # Force expired timestamp
    CHALLENGE_STORE[session_id5]["expires_at"] = time.time() - 10

    frames_expired = [to_bytes(base_img), to_bytes(img_left)]
    passed5, msg5, meta5 = verify_liveness_challenge(session_id5, frames_expired, detector)
    print(f"Result: passed={passed5}, message='{msg5}'")
    assert passed5 is False and "Expired" in msg5, f"Expected FAIL for expired token, got {msg5}"
    print("PASS: Expired liveness challenge correctly rejected.")

    # --- TEST 6: REPLAY / REUSED CHALLENGE -> FAIL ---
    print("\n--- TEST 6: Reused / Replay Challenge -> FAIL ---")
    challenge_data6 = create_liveness_challenge()
    session_id6 = challenge_data6["session_id"]
    CHALLENGE_STORE[session_id6]["challenge"] = "turn_left"
    CHALLENGE_STORE[session_id6]["expected_action"] = "yaw_left"

    # First attempt: succeeds and consumes the challenge
    passed6_a, _, _ = verify_liveness_challenge(session_id6, frames_pass, detector)
    assert passed6_a is True, "First attempt should succeed"

    # Second attempt (replay attack): MUST fail
    passed6_b, msg6_b, meta6_b = verify_liveness_challenge(session_id6, frames_pass, detector)
    print(f"Replay Attempt Result: passed={passed6_b}, message='{msg6_b}'")
    assert passed6_b is False and meta6_b.get("error_code") == "CHALLENGE_REUSED", f"Replay attack was not blocked!"
    print("PASS: Single-use challenge token enforced. Replay attack successfully blocked.")

    print("\n========================================================================")
    print("   ALL 6 PHASE 2 ACTIVE LIVENESS TESTS PASSED SUCCESSFULLY!")
    print("========================================================================")

if __name__ == '__main__':
    run_phase2_tests()
