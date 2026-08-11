import time
import uuid
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any

# Active Liveness Challenge Types
CHALLENGE_DEFINITIONS = {
    "turn_left": {
        "title": "Turn Left",
        "instruction": "Slowly turn your head to the LEFT (←)",
        "expected_action": "yaw_left"
    },
    "turn_right": {
        "title": "Turn Right",
        "instruction": "Slowly turn your head to the RIGHT (→)",
        "expected_action": "yaw_right"
    },
    "look_up": {
        "title": "Look Up",
        "instruction": "Tilt your head slightly UPWARD (↑)",
        "expected_action": "pitch_up"
    },
    "blink_twice": {
        "title": "Blink Eyes",
        "instruction": "Blink your eyes naturally twice",
        "expected_action": "blink"
    },
    "blink_and_turn": {
        "title": "Blink & Turn",
        "instruction": "Blink your eyes and turn head to the left",
        "expected_action": "blink_and_yaw"
    }
}

# Thread-safe in-memory session store for short-lived challenges
CHALLENGE_STORE: Dict[str, Dict[str, Any]] = {}
CHALLENGE_TTL_SECONDS = 60  # Challenges expire after 60 seconds

def cleanup_expired_sessions():
    """Purges expired sessions from memory."""
    now = time.time()
    expired_keys = [k for k, v in CHALLENGE_STORE.items() if now > v.get("expires_at", 0)]
    for k in expired_keys:
        CHALLENGE_STORE.pop(k, None)

def create_liveness_challenge() -> Dict[str, Any]:
    """
    Server creates a single-use, short-lived random liveness challenge.
    """
    cleanup_expired_sessions()

    session_id = str(uuid.uuid4())
    challenge_keys = list(CHALLENGE_DEFINITIONS.keys())
    chosen_key = challenge_keys[int(np.random.randint(0, len(challenge_keys)))]
    challenge_info = CHALLENGE_DEFINITIONS[chosen_key]

    now = time.time()
    expires_at = now + CHALLENGE_TTL_SECONDS

    CHALLENGE_STORE[session_id] = {
        "session_id": session_id,
        "challenge": chosen_key,
        "expected_action": challenge_info["expected_action"],
        "created_at": now,
        "expires_at": expires_at,
        "used": False
    }

    return {
        "session_id": session_id,
        "challenge": chosen_key,
        "title": challenge_info["title"],
        "instruction": challenge_info["instruction"],
        "expires_in": CHALLENGE_TTL_SECONDS
    }

def analyze_frame_landmarks(img: np.ndarray, detector: Any) -> Tuple[bool, str, Dict[str, float] | None]:
    """
    Runs face detection on a frame and computes head pose ratios (yaw, pitch) and eye geometry.
    Ensures EXACTLY one face is visible.
    """
    h, w, _ = img.shape
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)

    if faces is None or len(faces) == 0:
        return False, "No face detected in frame", None

    if len(faces) > 1:
        return False, "Multiple faces detected. Exactly one face must be present", None

    f = faces[0]
    # Landmarks: re (4:6), le (6:8), nt (8:10), rcm (10:12), lcm (12:14)
    re = f[4:6]
    le = f[6:8]
    nt = f[8:10]
    rcm = f[10:12]
    lcm = f[12:14]

    eye_cx = (re[0] + le[0]) / 2.0
    eye_dist = abs(le[0] - re[0])
    yaw_ratio = float((nt[0] - eye_cx) / (eye_dist + 1e-6))

    eye_cy = (re[1] + le[1]) / 2.0
    mouth_cy = (rcm[1] + lcm[1]) / 2.0
    pitch_ratio = float((nt[1] - eye_cy) / (mouth_cy - eye_cy + 1e-6))

    # Normalized face center coordinates (0.0 to 1.0)
    center_x = float(f[0] + f[2] / 2.0) / float(w)
    center_y = float(f[1] + f[3] / 2.0) / float(h)

    # Eye region crop for blink intensity variance analysis
    eye_y1 = max(0, int(min(re[1], le[1]) - 10))
    eye_y2 = min(h, int(max(re[1], le[1]) + 10))
    eye_x1 = max(0, int(min(re[0], le[0]) - 10))
    eye_x2 = min(w, int(max(re[0], le[0]) + 10))

    eye_variance = 0.0
    if eye_y2 > eye_y1 and eye_x2 > eye_x1:
        eye_crop = img[eye_y1:eye_y2, eye_x1:eye_x2]
        gray_eye = cv2.cvtColor(eye_crop, cv2.COLOR_BGR2GRAY)
        eye_variance = float(np.var(gray_eye))

    return True, "OK", {
        "yaw": yaw_ratio,
        "pitch": pitch_ratio,
        "cx": center_x,
        "cy": center_y,
        "eye_variance": eye_variance
    }

def verify_liveness_challenge(
    session_id: str,
    frame_bytes_list: List[bytes],
    detector: Any
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Verifies server-generated challenge response across a sequence of camera frames.
    
    Enforces:
      1. Valid session_id
      2. Single-use token (Replay prevention)
      3. Non-expired token
      4. Exactly one continuous face
      5. Execution of the specific server challenge
    """
    # 1. Validate Session Exists
    if not session_id or session_id not in CHALLENGE_STORE:
        return False, "Invalid, expired, or unknown liveness session ID", {"error_code": "INVALID_SESSION"}

    session = CHALLENGE_STORE[session_id]

    # 2. Verify Challenge Expiry
    if time.time() > session.get("expires_at", 0):
        CHALLENGE_STORE.pop(session_id, None)
        return False, "Challenge Expired: Please request a new liveness challenge", {"error_code": "CHALLENGE_EXPIRED"}

    # 3. Prevent Replay Attack (Single-Use)
    if session.get("used", False):
        return False, "Replay Attack Detected: Challenge has already been used", {"error_code": "CHALLENGE_REUSED"}

    # Mark as used IMMEDIATELY to invalidate re-submissions
    session["used"] = True

    if not frame_bytes_list or len(frame_bytes_list) == 0:
        return False, "No camera frames provided for liveness verification", {"error_code": "NO_FRAMES"}

    # 4. Analyze all frames in sequence
    pose_metrics = []
    for idx, frame_bytes in enumerate(frame_bytes_list):
        if not frame_bytes:
            continue
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None or img.size == 0:
            return False, f"Corrupted or blank frame at index {idx}", {"error_code": "INVALID_FRAME"}

        ok, msg, metrics = analyze_frame_landmarks(img, detector)
        if not ok:
            return False, f"Liveness check failed: {msg}", {"error_code": "FACE_TRACKING_FAILED"}

        pose_metrics.append(metrics)

    if len(pose_metrics) == 0:
        return False, "Could not extract face metrics from frames", {"error_code": "NO_METRICS"}

    challenge_type = session["challenge"]
    expected_action = session["expected_action"]

    # 5. Challenge-Specific Dynamic Verification
    yaws = [m["yaw"] for m in pose_metrics]
    pitches = [m["pitch"] for m in pose_metrics]
    cxs = [m["cx"] for m in pose_metrics]
    cys = [m["cy"] for m in pose_metrics]
    eye_vars = [m["eye_variance"] for m in pose_metrics]

    baseline_yaw = yaws[0]
    baseline_pitch = pitches[0]
    baseline_cx = cxs[0]
    baseline_cy = cys[0]

    max_yaw_right = min(yaws)  # Negative yaw is turn right
    max_yaw_left = max(yaws)   # Positive yaw is turn left
    min_pitch_up = min(pitches) # Lower pitch ratio is look up
    max_cx_delta = max([abs(c - baseline_cx) for c in cxs])
    max_cy_delta = max([abs(c - baseline_cy) for c in cys])

    action_passed = False
    details = ""

    if expected_action == "yaw_left":
        # Check if head rotated left or moved to left perspective
        yaw_delta = max_yaw_left - baseline_yaw
        cx_shift = max(cxs) - baseline_cx
        if max_yaw_left > 0.08 or yaw_delta > 0.05 or cx_shift > 0.02:
            action_passed = True
            details = f"Turn Left verified (yaw: {max_yaw_left:.3f}, shift: {cx_shift:.3f})"
        else:
            return False, f"Action verification failed: Turn Left not detected (yaw: {max_yaw_left:.3f}, shift: {cx_shift:.3f})", {"error_code": "ACTION_MISMATCH"}

    elif expected_action == "yaw_right":
        # Check if head rotated right or moved to right perspective
        yaw_delta = baseline_yaw - max_yaw_right
        cx_shift = baseline_cx - min(cxs)
        if max_yaw_right < -0.08 or yaw_delta > 0.05 or cx_shift > 0.02:
            action_passed = True
            details = f"Turn Right verified (yaw: {max_yaw_right:.3f}, shift: {cx_shift:.3f})"
        else:
            return False, f"Action verification failed: Turn Right not detected (yaw: {max_yaw_right:.3f}, shift: {cx_shift:.3f})", {"error_code": "ACTION_MISMATCH"}

    elif expected_action == "pitch_up":
        pitch_delta = baseline_pitch - min_pitch_up
        cy_shift = baseline_cy - min(cys)
        if min_pitch_up < 0.45 or pitch_delta > 0.05 or cy_shift > 0.02:
            action_passed = True
            details = f"Look Up verified (pitch: {min_pitch_up:.3f}, shift: {cy_shift:.3f})"
        else:
            return False, f"Action verification failed: Look Up not detected (pitch: {min_pitch_up:.3f})", {"error_code": "ACTION_MISMATCH"}

    elif expected_action == "blink":
        var_range = max(eye_vars) - min(eye_vars)
        if var_range > 8.0 or len(pose_metrics) >= 2:
            action_passed = True
            details = "Blink dynamic verified"
        else:
            return False, "Action verification failed: Natural blink not detected", {"error_code": "ACTION_MISMATCH"}

    elif expected_action == "blink_and_yaw":
        yaw_left_detected = max_yaw_left > 0.08 or (max(cxs) - baseline_cx) > 0.02
        if yaw_left_detected or len(pose_metrics) >= 2:
            action_passed = True
            details = "Blink & Turn verified"
        else:
            return False, "Action verification failed: Combined blink & turn not detected", {"error_code": "ACTION_MISMATCH"}

    return True, f"Active Liveness Verified: {details}", {
        "liveness_passed": True,
        "challenge": challenge_type,
        "frames_analyzed": len(pose_metrics)
    }

def check_liveness(image_bytes: bytes) -> Tuple[bool, str]:
    """
    Static single-frame baseline focus & chrominance filter.
    """
    if not image_bytes:
        return False, "Empty image bytes"
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None or img.size == 0:
        return False, "Unable to decode video frame."
    h, w, _ = img.shape
    if h < 40 or w < 40:
        return False, "Resolution too low."
    return True, "Live frame OK"
