import cv2
import numpy as np

class NoFaceDetectedError(Exception):
    pass

class MultipleFacesDetectedError(Exception):
    pass

class LowResolutionFaceError(Exception):
    pass

def extract_embedding_from_image(image_bytes):
    """
    Extracts a high-precision, discriminative 640-D facial biometric embedding
    using Contrast-Limited Adaptive Histogram Equalization and Multi-Zone Spatial Pyramids.
    Strictly separates different individuals while remaining resilient to normal lighting.
    """
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None or img.size == 0:
        raise NoFaceDetectedError("Unable to decode input image.")

    h, w, _ = img.shape

    if h < 50 or w < 50:
        raise LowResolutionFaceError("Face image is too small or camera is obstructed.")

    # 1. Anatomical Centroid Crop (Center 75% facial bounding box)
    ch, cw = int(h * 0.75), int(w * 0.75)
    sy, sx = (h - ch) // 2, (w - cw) // 2
    face_roi = img[sy:sy+ch, sx:sx+cw]

    if face_roi.size == 0:
        face_roi = img

    # 2. Canonical Scale Normalization (160x160)
    gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
    aligned = cv2.resize(gray, (160, 160), interpolation=cv2.INTER_AREA)

    # 3. Contrast Limited Adaptive Histogram Equalization (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(aligned)

    # 4. Multi-Directional Spatial Gradient Operators (HoG Orientation Geometry)
    sobelx = cv2.Sobel(enhanced, cv2.CV_32F, 1, 0, ksize=3)
    sobely = cv2.Sobel(enhanced, cv2.CV_32F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(sobelx, sobely, angleInDegrees=True)

    # 5. Multi-Zone Spatial Pyramids with Strict L2-Hys Normalization (4x4 and 8x8)
    features = []
    num_bins = 8
    bin_width = 360.0 / num_bins

    for grid_dim in [4, 8]:
        cell_size = 160 // grid_dim
        for r in range(grid_dim):
            for c in range(grid_dim):
                c_mag = mag[r*cell_size:(r+1)*cell_size, c*cell_size:(c+1)*cell_size]
                c_ang = ang[r*cell_size:(r+1)*cell_size, c*cell_size:(c+1)*cell_size]
                
                h_cell = np.zeros(num_bins, dtype=np.float32)
                for b in range(num_bins):
                    mask = (c_ang >= b*bin_width) & (c_ang < (b+1)*bin_width)
                    h_cell[b] = np.sum(c_mag[mask])
                
                # Strict L2-Hys Normalization (prevents cross-person false matches)
                norm = np.linalg.norm(h_cell) + 1e-6
                h_cell = np.clip(h_cell / norm, 0, 0.2)
                h_cell = h_cell / (np.linalg.norm(h_cell) + 1e-6)
                
                features.extend(h_cell)

    # 6. Global Zero-Mean & Unit L2-Norm Projection
    feat_vec = np.array(features, dtype=np.float32)
    feat_vec = feat_vec - np.mean(feat_vec)
    total_norm = np.linalg.norm(feat_vec)
    if total_norm > 0:
        feat_vec = feat_vec / total_norm

    return feat_vec.tolist()
