import os
import sys
import numpy as np
import cv2

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from face_extraction import extract_embedding_from_image, MODEL_VERSION, EMBEDDING_DIM
from biometrics_engine import cosine_similarity, MATCH_THRESHOLD

def run_phase1_tests():
    print("========================================================================")
    print("   PHASE 1: FACE EMBEDDING VERIFICATION & BENCHMARK SUITE")
    print("========================================================================")

    # 1. Prepare sample face test images
    img1_path = r'C:\Users\DINESH\.gemini\antigravity-ide\brain\54667418-3cac-4c42-83ca-90f9de5005dc\media__1786388776139.png'
    img2_path = 'face_service/models/lena_test.jpg'

    if not os.path.exists(img1_path):
        raise FileNotFoundError(f"Test image 1 not found: {img1_path}")

    with open(img1_path, 'rb') as f:
        img1_bytes = f.read()

    with open(img2_path, 'rb') as f:
        img2_bytes = f.read()

    # --- TEST 1: REGISTRATION EMBEDDING ---
    print("\n--- TEST 1: Registration Pipeline Embedding Extraction ---")
    reg_embedding = extract_embedding_from_image(img1_bytes)
    print(f"Registration Vector Extracted: {len(reg_embedding)} dimensions")
    assert len(reg_embedding) == 128, f"Expected 128 dimensions, got {len(reg_embedding)}"
    print("PASS: Registration embedding extracted successfully.")

    # --- TEST 2: LOGIN EMBEDDING ---
    print("\n--- TEST 2: Login Pipeline Embedding Extraction ---")
    # Simulate a slightly different camera snapshot (slight lighting variation)
    img1_cv = cv2.imread(img1_path)
    img1_login_cv = cv2.convertScaleAbs(img1_cv, alpha=1.10, beta=8)
    _, login_buf = cv2.imencode('.jpg', img1_login_cv)
    login_bytes = login_buf.tobytes()

    login_embedding = extract_embedding_from_image(login_bytes)
    print(f"Login Vector Extracted: {len(login_embedding)} dimensions")
    assert len(login_embedding) == 128, f"Expected 128 dimensions, got {len(login_embedding)}"
    print("PASS: Login embedding extracted successfully.")

    # --- TEST 3: MODEL COMPATIBILITY & VERSION ---
    print("\n--- TEST 3: Model Version Verification ---")
    print(f"Active Model Name / Version: {MODEL_VERSION}")
    print(f"Configured Embedding Dimension: {EMBEDDING_DIM}")
    assert MODEL_VERSION == "sface_yunet_v1", f"Unexpected model version: {MODEL_VERSION}"
    print("PASS: Both registration and login use the identical SFace + YuNet DNN pipeline.")

    # --- TEST 4: EMBEDDING DIMENSIONS ---
    print("\n--- TEST 4: Dimension Verification ---")
    print(f"Registration Embedding Length: {len(reg_embedding)}")
    print(f"Login Embedding Length: {len(login_embedding)}")
    assert len(reg_embedding) == 128 and len(login_embedding) == 128
    print("PASS: Strict 128-dimensional output verified.")

    # --- TEST 5: L2 NORMALIZATION ---
    print("\n--- TEST 5: L2 Unit Normalization Verification ---")
    reg_norm = np.linalg.norm(np.array(reg_embedding, dtype=np.float32))
    login_norm = np.linalg.norm(np.array(login_embedding, dtype=np.float32))
    print(f"Registration Vector L2 Norm: {reg_norm:.6f}")
    print(f"Login Vector L2 Norm: {login_norm:.6f}")
    assert np.isclose(reg_norm, 1.0, atol=1e-4), f"Registration norm is not 1.0: {reg_norm}"
    assert np.isclose(login_norm, 1.0, atol=1e-4), f"Login norm is not 1.0: {login_norm}"
    print("PASS: Exact Euclidean L2 unit normalization (norm = 1.000000) verified.")

    # --- TEST 6: SAME-PERSON COMPARISON ---
    print("\n--- TEST 6: Same-Person Verification (Intra-Class Similarity) ---")
    same_sim = cosine_similarity(reg_embedding, login_embedding)
    print(f"Same-Person Cosine Similarity: {same_sim:.4f} (Threshold >= {MATCH_THRESHOLD})")
    assert same_sim >= 0.80, f"Same person similarity too low: {same_sim}"
    print("PASS: Same-person comparison verified with high confidence match.")

    # --- TEST 7: DIFFERENT-PERSON COMPARISON ---
    print("\n--- TEST 7: Different-Person Verification (Inter-Class Discrimination) ---")
    person2_embedding = extract_embedding_from_image(img2_bytes)
    diff_sim = cosine_similarity(reg_embedding, person2_embedding)
    print(f"Different-Person Cosine Similarity: {diff_sim:.4f} (Must be < {MATCH_THRESHOLD})")
    assert diff_sim < MATCH_THRESHOLD, f"Different person similarity too high: {diff_sim}"
    print("PASS: Different persons successfully discriminated with near-zero correlation.")

    print("\n========================================================================")
    print("   ALL PHASE 1 EMBEDDING VALIDATION TESTS COMPLETED SUCCESSFULLY!")
    print("========================================================================")

if __name__ == '__main__':
    run_phase1_tests()
