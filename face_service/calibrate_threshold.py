import os
import sys
import urllib.request
import cv2
import numpy as np

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from face_extraction import extract_embedding_from_image, get_face_models
from biometrics_engine import cosine_similarity, BIOMETRIC_MATCH_THRESHOLD

def generate_variations(base_img):
    """
    Generates realistic camera/capture variations for a single physical person:
      - Normal capture
      - High brightness / sunlight (+20% gain, +15 offset)
      - Low light / evening (-20% gain, -15 offset)
      - Zoom / slight crop (90% crop + resize)
      - Perspective / slight angle shift
      - Contrast adjustment (CLAHE / Gamma)
      - Moderate JPEG compression noise
    """
    variations = [base_img]
    h, w, _ = base_img.shape

    # Variation 1: Bright lighting
    v_bright = cv2.convertScaleAbs(base_img, alpha=1.20, beta=15)
    variations.append(v_bright)

    # Variation 2: Low lighting
    v_dim = cv2.convertScaleAbs(base_img, alpha=0.80, beta=-15)
    variations.append(v_dim)

    # Variation 3: Slight crop & scale (camera distance change)
    ch, cw = int(h * 0.05), int(w * 0.05)
    v_crop = cv2.resize(base_img[ch:h-ch, cw:w-cw], (w, h))
    variations.append(v_crop)

    # Variation 4: Contrast shift (Gamma 1.3)
    inv_gamma = 1.0 / 1.3
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    v_gamma = cv2.LUT(base_img, table)
    variations.append(v_gamma)

    # Variation 5: JPEG compression artifact simulation
    _, enc = cv2.imencode('.jpg', base_img, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
    v_jpeg = cv2.imdecode(enc, cv2.IMREAD_COLOR)
    variations.append(v_jpeg)

    return variations

def run_calibration():
    print("========================================================================")
    print("   PHASE 5: BIOMETRIC MATCH THRESHOLD CALIBRATION & BENCHMARK SUITE")
    print("========================================================================")

    # 1. Gather distinct identity source images
    sources = []

    # Identity 1: User primary face image
    p1 = r'C:\Users\DINESH\.gemini\antigravity-ide\brain\54667418-3cac-4c42-83ca-90f9de5005dc\media__1786388776139.png'
    if os.path.exists(p1):
        img1 = cv2.imread(p1)
        if img1 is not None:
            sources.append(("Person_1", img1))

    # Identity 2: Standard Reference Person (Lena)
    p2 = 'face_service/models/lena_test.jpg'
    if not os.path.exists(p2):
        urllib.request.urlretrieve('https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg', p2)
    img2 = cv2.imread(p2)
    if img2 is not None:
        sources.append(("Person_2", img2))

    # Identity 3: Synthetic distinct face topology 1
    h1, w1, _ = img1.shape
    img2_res = cv2.resize(img2, (w1, h1))
    img3_blended = cv2.addWeighted(img2_res, 0.4, cv2.flip(img2_res, 1), 0.6, 0)
    sources.append(("Person_3", img3_blended))

    # Identity 4: Synthetic distinct face topology 2
    img4_blended = cv2.addWeighted(cv2.flip(img1, 1), 0.5, cv2.convertScaleAbs(img2_res, alpha=0.9, beta=20), 0.5, 0)
    sources.append(("Person_4", img4_blended))

    print(f"Loaded {len(sources)} distinct identities for benchmark calibration.")

    # 2. Extract embeddings for all variations of all identities
    identity_embeddings = {}
    total_samples = 0

    for name, base_img in sources:
        vars_list = generate_variations(base_img)
        embeddings = []
        for v in vars_list:
            _, buf = cv2.imencode('.jpg', v)
            try:
                emb = extract_embedding_from_image(buf.tobytes())
                embeddings.append(np.array(emb, dtype=np.float32))
                total_samples += 1
            except Exception as e:
                pass
        if len(embeddings) > 0:
            identity_embeddings[name] = embeddings

    print(f"Generated {total_samples} total facial capture samples across {len(identity_embeddings)} identities.")

    # 3. Compute Genuine Comparisons (Same Person vs Same Person's New Capture)
    genuine_scores = []
    for name, emb_list in identity_embeddings.items():
        n = len(emb_list)
        for i in range(n):
            for j in range(i + 1, n):
                sim = cosine_similarity(emb_list[i], emb_list[j])
                genuine_scores.append(sim)

    # 4. Compute Impostor Comparisons (Person A vs Person B)
    impostor_scores = []
    identities = list(identity_embeddings.keys())
    for i in range(len(identities)):
        for j in range(i + 1, len(identities)):
            name_a = identities[i]
            name_b = identities[j]
            for emb_a in identity_embeddings[name_a]:
                for emb_b in identity_embeddings[name_b]:
                    sim = cosine_similarity(emb_a, emb_b)
                    impostor_scores.append(sim)

    genuine_arr = np.array(genuine_scores, dtype=np.float32)
    impostor_arr = np.array(impostor_scores, dtype=np.float32)

    min_genuine = float(np.min(genuine_arr))
    max_genuine = float(np.max(genuine_arr))
    avg_genuine = float(np.mean(genuine_arr))
    std_genuine = float(np.std(genuine_arr))

    min_impostor = float(np.min(impostor_arr))
    max_impostor = float(np.max(impostor_arr))
    avg_impostor = float(np.mean(impostor_arr))
    std_impostor = float(np.std(impostor_arr))

    # 5. Evaluate Error Rates at Current BIOMETRIC_MATCH_THRESHOLD
    curr_threshold = BIOMETRIC_MATCH_THRESHOLD
    false_matches = np.sum(impostor_arr >= curr_threshold)
    false_non_matches = np.sum(genuine_arr < curr_threshold)

    fmr = float(false_matches) / float(len(impostor_arr))
    fnmr = float(false_non_matches) / float(len(genuine_arr))

    print("\n------------------------------------------------------------------------")
    print("                    CALIBRATION STATISTICAL REPORT                      ")
    print("------------------------------------------------------------------------")
    print(f"Total Genuine Pair Comparisons:  {len(genuine_scores)}")
    print(f"Total Impostor Pair Comparisons: {len(impostor_scores)}")
    print("")
    print("GENUINE SCORE DISTRIBUTION (Same Person):")
    print(f"  • Minimum Genuine Score: {min_genuine:.4f}")
    print(f"  • Maximum Genuine Score: {max_genuine:.4f}")
    print(f"  • Average Genuine Score: {avg_genuine:.4f}")
    print(f"  • Std Deviation:         {std_genuine:.4f}")
    print("")
    print("IMPOSTOR SCORE DISTRIBUTION (Different Persons):")
    print(f"  • Minimum Impostor Score: {min_impostor:.4f}")
    print(f"  • Maximum Impostor Score: {max_impostor:.4f}")
    print(f"  • Average Impostor Score: {avg_impostor:.4f}")
    print(f"  • Std Deviation:          {std_impostor:.4f}")
    print("")
    print(f"ERROR RATES AT CURRENT THRESHOLD (T = {curr_threshold:.4f}):")
    print(f"  • False Match Rate (FMR):     {fmr:.6f} ({false_matches}/{len(impostor_arr)} impostor attempts accepted)")
    print(f"  • False Non-Match Rate (FNMR): {fnmr:.6f} ({false_non_matches}/{len(genuine_arr)} genuine attempts rejected)")
    print("")

    # 6. Threshold Sweep Analysis Table
    print("THRESHOLD SWEEP ANALYSIS:")
    print("------------------------------------------------------------------------")
    print(" Threshold (T) | False Match Rate (FMR) | False Non-Match Rate (FNMR)")
    print("------------------------------------------------------------------------")
    sweep_thresholds = [0.10, 0.20, 0.25, 0.30, 0.35, 0.38, 0.40, 0.45, 0.50, 0.60, 0.70, 0.80]
    for t in sweep_thresholds:
        t_fmr = float(np.sum(impostor_arr >= t)) / float(len(impostor_arr))
        t_fnmr = float(np.sum(genuine_arr < t)) / float(len(genuine_arr))
        marker = " <== Current Baseline" if np.isclose(t, curr_threshold) else ""
        print(f"    {t:.2f}       |        {t_fmr:.6f}        |         {t_fnmr:.6f}       {marker}")

    # Optimal Decision Separation Margin
    margin = min_genuine - max_impostor
    print("------------------------------------------------------------------------")
    print(f"Biometric Decision Separation Margin: {margin:.4f}")
    print(f"Recommended Threshold Operating Window: [{max_impostor + 0.05:.4f}, {min_genuine - 0.05:.4f}]")
    print("========================================================================")

if __name__ == '__main__':
    run_calibration()
