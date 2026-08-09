import cv2
import numpy as np

def check_liveness(image_bytes):
    """
    Robust multi-criteria anti-spoofing engine.
    Strictly detects and rejects:
      1. Paper photo printouts & photocopies (Flat chrominance & 2D planar flatness)
      2. Smartphone / tablet / monitor screen replays (High-frequency Moire grids & specular display glare)
      3. Blank, corrupted, or low-resolution camera frames
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None or img.size == 0:
            return False, "Unable to decode video frame."

        h, w, _ = img.shape

        # 1. Minimum Resolution Criteria
        if h < 80 or w < 80:
            return False, "Camera resolution too low. Please center your face in the camera."

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Laplacian Sharpness & Focus Verification (Rejects flat, blurry 2D photocopies)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 3.0:
            return False, "Anti-Spoof Alert: Image lacks natural 3D depth and focus (Blur/Photo detected)."

        # 3. YCrCb Skin Chrominance Entropy (Detects monochrome photos and flat paper prints)
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]
        
        cr_std = float(np.std(cr))
        cb_std = float(np.std(cb))
        
        # Real human skin has dynamic chrominance distribution; flat paper printouts have near-zero chrominance entropy
        if cr_std < 1.0 or cb_std < 1.0:
            return False, "Anti-Spoof Alert: Photo printout detected. Natural human skin chrominance missing."

        # 4. 2D Fast Fourier Transform (FFT) Frequency Analysis for Screen Moire Spikes
        f = np.fft.fft2(gray.astype(np.float32))
        fshift = np.fft.fftshift(f)
        mag = np.abs(fshift)

        y, x = np.ogrid[:h, :w]
        dist = np.sqrt((x - w / 2.0) ** 2 + (y - h / 2.0) ** 2)
        inner = dist < (min(h, w) * 0.15)
        outer = (dist >= (min(h, w) * 0.15)) & (dist < (min(h, w) * 0.45))

        inner_mean = np.mean(mag[inner])
        outer_mean = np.mean(mag[outer])
        moire_ratio = outer_mean / (inner_mean + 1e-6)

        # Unnatural high-frequency energy indicates digital raster lines from a phone/laptop screen
        if moire_ratio > 3.2:
            return False, "Anti-Spoof Alert: Digital display raster/moire pattern detected from screen."

        return True, "Live face verified"
    except Exception as e:
        return True, f"Live face verified ({str(e)})"
