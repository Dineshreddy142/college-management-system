import cv2
import numpy as np
from typing import Dict, Any, Tuple

# Calibrated Pose Threshold Boundaries
YAW_FRONT_MAX = 0.10
YAW_RIGHT_THRESHOLD = -0.14  # Turn Right
YAW_LEFT_THRESHOLD = 0.14   # Turn Left
PITCH_FRONT_MIN = 0.45
PITCH_FRONT_MAX = 0.72
PITCH_UP_THRESHOLD = 0.42   # Look Up
ROLL_MAX_DEGREES = 18.0

# Quality Thresholds
MIN_FACE_SCALE_RATIO = 0.12  # Face bounding box width must be >= 12% of frame width
MIN_BRIGHTNESS = 38.0
MAX_BRIGHTNESS = 242.0
MIN_SHARPNESS_LAPLACIAN = 12.0

def validate_enrollment_frame(
    image_bytes: bytes,
    expected_pose: str,
    detector: Any
) -> Dict[str, Any]:
    """
    Independently evaluates a candidate camera frame for automatic pose-guided enrollment.
    Enforces:
      1. Single face constraint
      2. Frame quality (lighting, sharpness/blur, face size/centering)
      3. Precise 3D head pose estimation (Yaw, Pitch, Roll)
      4. Match against expected_pose ('front', 'right', 'left', 'up')
    """
    if not image_bytes or len(image_bytes) == 0:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "none",
            "feedback": "No video feed received.",
            "metrics": {}
        }

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None or img.size == 0:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "none",
            "feedback": "Unable to decode camera frame.",
            "metrics": {}
        }

    h, w, _ = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Quality Check: Lighting
    brightness = float(np.mean(gray))
    if brightness < MIN_BRIGHTNESS:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "none",
            "feedback": "Improve lighting (frame too dark)",
            "metrics": {"brightness": brightness}
        }
    if brightness > MAX_BRIGHTNESS:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "none",
            "feedback": "Reduce glare (frame overexposed)",
            "metrics": {"brightness": brightness}
        }

    # 2. Quality Check: Sharpness / Blur
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if sharpness < MIN_SHARPNESS_LAPLACIAN:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "none",
            "feedback": "Hold steady, camera is blurry",
            "metrics": {"sharpness": sharpness, "brightness": brightness}
        }

    # 3. Face Detection & Landmark Extraction
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)

    if faces is None or len(faces) == 0:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "none",
            "feedback": "No face detected. Center your face in camera.",
            "metrics": {"brightness": brightness, "sharpness": sharpness}
        }

    if len(faces) > 1:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "multiple",
            "feedback": "Multiple people detected. Only one person allowed.",
            "metrics": {"face_count": len(faces)}
        }

    f = faces[0]
    bbox_w = float(f[2])
    bbox_h = float(f[3])
    face_scale = bbox_w / float(w)

    # 4. Quality Check: Face Size & Distance
    if face_scale < MIN_FACE_SCALE_RATIO:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "too_far",
            "feedback": "Move closer to the camera",
            "metrics": {"face_scale": face_scale}
        }

    # 5. Extract Landmarks for Head Pose (Yaw, Pitch, Roll)
    re = f[4:6]  # Right eye
    le = f[6:8]  # Left eye
    nt = f[8:10] # Nose tip
    rcm = f[10:12] # Right mouth corner
    lcm = f[12:14] # Left mouth corner

    eye_cx = (re[0] + le[0]) / 2.0
    eye_dist = abs(le[0] - re[0])
    yaw_ratio = float((nt[0] - eye_cx) / (eye_dist + 1e-6))

    d_left_eye = abs(le[0] - nt[0])
    d_right_eye = abs(nt[0] - re[0])
    asym_ratio = float(d_left_eye / (d_right_eye + 1e-6))

    eye_cy = (re[1] + le[1]) / 2.0
    mouth_cy = (rcm[1] + lcm[1]) / 2.0
    pitch_ratio = float((nt[1] - eye_cy) / (mouth_cy - eye_cy + 1e-6))

    roll_deg = float(np.degrees(np.arctan2(le[1] - re[1], le[0] - re[0])))

    metrics = {
        "yaw": yaw_ratio,
        "pitch": pitch_ratio,
        "roll": roll_deg,
        "asym_ratio": asym_ratio,
        "brightness": brightness,
        "sharpness": sharpness,
        "face_scale": face_scale
    }

    # 6. Check Head Tilt / Roll Angle
    if abs(roll_deg) > ROLL_MAX_DEGREES:
        return {
            "valid": False,
            "quality_passed": False,
            "pose_detected": "tilted",
            "feedback": "Keep head level (avoid tilting)",
            "metrics": metrics
        }

    # 7. Classify Detected Head Pose
    pose_detected = "unknown"
    if (abs(yaw_ratio) <= 0.08 or (0.85 <= asym_ratio <= 1.18)) and (0.50 <= pitch_ratio <= 0.72):
        pose_detected = "front"
    elif yaw_ratio < -0.06 or asym_ratio < 0.82:
        pose_detected = "right"
    elif yaw_ratio > 0.06 or asym_ratio > 1.22:
        pose_detected = "left"
    elif pitch_ratio < 0.48:
        pose_detected = "up"

    # 8. Compare against Expected Target Pose
    target = expected_pose.lower().strip()
    is_valid = (pose_detected == target)

    feedback = "Hold still..."
    if not is_valid:
        if target == "front":
            if pose_detected == "left": feedback = "Turn back to center (look straight)"
            elif pose_detected == "right": feedback = "Turn back to center (look straight)"
            elif pose_detected == "up": feedback = "Lower your head (look straight)"
            else: feedback = "Look straight at the camera"
        elif target == "right":
            if pose_detected == "front": feedback = "Slowly turn your face to the RIGHT (->)"
            elif pose_detected == "left": feedback = "Turn to the RIGHT (->)"
            else: feedback = "Turn further right"
        elif target == "left":
            if pose_detected == "front": feedback = "Slowly turn your face to the LEFT (<-)"
            elif pose_detected == "right": feedback = "Turn to the LEFT (<-)"
            else: feedback = "Turn further left"
        elif target == "up":
            if pose_detected == "front": feedback = "Slowly look UP (^)"
            else: feedback = "Look higher (tilt head up)"

    return {
        "valid": is_valid,
        "quality_passed": True,
        "pose_detected": pose_detected,
        "expected_pose": target,
        "feedback": feedback if not is_valid else "Pose detected! Hold still...",
        "metrics": metrics
    }
