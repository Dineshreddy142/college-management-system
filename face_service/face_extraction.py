import os
import cv2
import numpy as np

# Model metadata
MODEL_VERSION = "sface_yunet_v1"
EMBEDDING_DIM = 128

class NoFaceDetectedError(Exception):
    pass

class MultipleFacesDetectedError(Exception):
    pass

class LowResolutionFaceError(Exception):
    pass

# Locate model files relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

YUNET_MODEL_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_MODEL_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

# Global singleton detector & recognizer instances
_DETECTOR = None
_RECOGNIZER = None

def get_face_models():
    """
    Initializes and returns the singleton YuNet Face Detector and SFace Recognizer.
    """
    global _DETECTOR, _RECOGNIZER
    if _DETECTOR is None or _RECOGNIZER is None:
        if not os.path.exists(YUNET_MODEL_PATH) or not os.path.exists(SFACE_MODEL_PATH):
            raise FileNotFoundError(f"DNN Model files missing in {MODELS_DIR}. Ensure YuNet and SFace ONNX models are present.")

        _DETECTOR = cv2.FaceDetectorYN.create(YUNET_MODEL_PATH, "", (320, 320), 0.45, 0.3, 5000)
        _RECOGNIZER = cv2.FaceRecognizerSF.create(SFACE_MODEL_PATH, "")

    return _DETECTOR, _RECOGNIZER

def extract_embedding_from_image(image_bytes, strict_single_face: bool = True):
    """
    Standard Deep Neural Network Face Biometrics Pipeline:
      1. Camera Input Decoding (cv2.imdecode)
      2. Face Detection (YuNet DNN)
      3. Face Alignment (5-Point Landmark Affine AlignCrop)
      4. Identity Embedding Extraction (SFace DNN -> 128-D)
      5. L2 Normalization (||V||_2 = 1.0)
    
    Returns: list[float] (128-dimensional L2-normalized float array)
    """
    if not image_bytes or len(image_bytes) == 0:
        raise NoFaceDetectedError("Empty image buffer received.")

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None or img.size == 0:
        raise NoFaceDetectedError("Unable to decode input image.")

    h, w, _ = img.shape
    if h < 40 or w < 40:
        raise LowResolutionFaceError("Face image is too small or camera is obstructed.")

    detector, recognizer = get_face_models()

    # 1. Update detector dynamic input resolution
    detector.setInputSize((w, h))

    # 2. Face Detection
    _, faces = detector.detect(img)

    if faces is None or len(faces) == 0:
        # Retry with higher contrast & scaling for challenging lighting
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        _, faces = detector.detect(enhanced_bgr)

    if faces is None or len(faces) == 0:
        raise NoFaceDetectedError("No human face detected in frame. Please look directly at the camera.")

    if len(faces) > 1 and strict_single_face:
        raise MultipleFacesDetectedError("Multiple human faces detected in frame. Exactly one face must be present for authentication.")

    primary_face = faces[0]
    if len(faces) > 1:
        primary_face = max(faces, key=lambda f: f[2] * f[3])

    # 3. Face Alignment (5 landmarks: 2 eyes, nose tip, 2 mouth corners)
    aligned_face = recognizer.alignCrop(img, primary_face)

    # 4. Deep Neural Network Identity Feature Extraction (SFace 128-D)
    feature = recognizer.feature(aligned_face)
    feat_vec = np.array(feature, dtype=np.float32).flatten()

    # 5. Strict Euclidean L2 Normalization (||V||_2 = 1.0)
    norm = np.linalg.norm(feat_vec)
    if norm > 0:
        feat_vec = feat_vec / norm

    return feat_vec.tolist()

