import os
import sys
import numpy as np
from flask import Flask, request, jsonify

# Add module paths
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from face_service.crypto import encrypt_embedding, decrypt_embedding
    from face_service.face_extraction import (
        extract_embedding_from_image,
        MODEL_VERSION,
        EMBEDDING_DIM,
        NoFaceDetectedError,
        MultipleFacesDetectedError,
        LowResolutionFaceError
    )
    from face_service.liveness import check_liveness
    from face_service.biometrics_engine import (
        cosine_similarity,
        check_duplicate_face,
        identify_face,
        MATCH_THRESHOLD
    )
    from face_service.models import (
        save_face_embedding,
        get_all_face_embeddings,
        log_auth_attempt
    )
except ImportError:
    from crypto import encrypt_embedding, decrypt_embedding
    from face_extraction import (
        extract_embedding_from_image,
        MODEL_VERSION,
        EMBEDDING_DIM,
        NoFaceDetectedError,
        MultipleFacesDetectedError,
        LowResolutionFaceError
    )
    from liveness import check_liveness
    from biometrics_engine import (
        cosine_similarity,
        check_duplicate_face,
        identify_face,
        MATCH_THRESHOLD
    )
    from models import (
        save_face_embedding,
        get_all_face_embeddings,
        log_auth_attempt
    )

app = Flask(__name__)

# High-Performance In-Memory Cache for sub-millisecond recognition
IN_MEMORY_EMBEDDINGS = []
CACHE_INITIALIZED = False

def reload_biometric_cache():
    global IN_MEMORY_EMBEDDINGS, CACHE_INITIALIZED
    try:
        raw_rows = get_all_face_embeddings()
        recs = []
        for user_id, enc_bytes, iv_bytes in raw_rows:
            try:
                decrypted_emb = decrypt_embedding(enc_bytes, iv_bytes)
                recs.append((user_id, decrypted_emb))
            except Exception as e:
                app.logger.error(f"[CACHE] Error decrypting user {user_id}: {str(e)}")
        IN_MEMORY_EMBEDDINGS = recs
        CACHE_INITIALIZED = True
        app.logger.info(f"[CACHE] Loaded {len(IN_MEMORY_EMBEDDINGS)} facial vectors into high-speed memory.")
    except Exception as e:
        app.logger.error(f"[CACHE] Error initializing cache: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    if not CACHE_INITIALIZED:
        reload_biometric_cache()
    return jsonify({
        "status": "healthy",
        "service": "python_face_biometrics_sface_yunet",
        "model_version": MODEL_VERSION,
        "embedding_dim": EMBEDDING_DIM,
        "cached_vectors": len(IN_MEMORY_EMBEDDINGS),
        "threshold": MATCH_THRESHOLD
    }), 200

@app.route('/register', methods=['POST'])
def register_face():
    ip_address = request.remote_addr or '127.0.0.1'
    user_id = request.form.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400
        
    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid user_id"}), 400

    # Collect all image files (Multi-Pose 3D: Front, Left, Right, Tilt)
    uploaded_files = request.files.getlist('images')
    if not uploaded_files and 'image' in request.files:
        uploaded_files = request.files.getlist('image')

    if not uploaded_files:
        return jsonify({"success": False, "message": "No image files provided for face registration"}), 400

    extracted_embeddings = []

    for file in uploaded_files:
        image_bytes = file.read()
        if not image_bytes:
            continue

        # Liveness & anti-spoof check per angle
        liveness_ok, liveness_msg = check_liveness(image_bytes)
        if not liveness_ok:
            log_auth_attempt(user_id, False, 0.0, ip_address, False)
            return jsonify({
                "success": False,
                "message": liveness_msg or "Liveness verification failed on one or more 3D face angles."
            }), 400

        try:
            emb = extract_embedding_from_image(image_bytes)
            extracted_embeddings.append(np.array(emb, dtype=np.float32))
        except Exception as e:
            app.logger.warning(f"[FACE_SERVICE] Angle extraction notice: {str(e)}")

    if len(extracted_embeddings) == 0:
        return jsonify({"success": False, "message": "Failed to extract biometric features from provided face angles."}), 400

    # 3D Multi-Pose Vector Fusion
    if len(extracted_embeddings) == 1:
        live_embedding = extracted_embeddings[0].tolist()
    else:
        # Fuse all 3D poses (Center, Left, Right, Tilt) into unified master embedding
        fused_vec = np.mean(extracted_embeddings, axis=0)
        norm = np.linalg.norm(fused_vec)
        if norm > 0:
            fused_vec = fused_vec / norm
        live_embedding = fused_vec.tolist()

    # Duplicate face check using high-speed in-memory cache
    if not CACHE_INITIALIZED:
        reload_biometric_cache()

    is_dup, dup_user_id, sim = check_duplicate_face(live_embedding, IN_MEMORY_EMBEDDINGS, exclude_user_id=user_id)
    if is_dup:
        log_auth_attempt(user_id, False, sim, ip_address, True)
        return jsonify({
            "success": False,
            "message": "Duplicate Face Detected: This physical face is already registered to another user account."
        }), 400

    # Encrypt 3D composite embedding using AES-256 and store in MySQL
    try:
        enc_bytes, iv_bytes = encrypt_embedding(live_embedding)
        save_face_embedding(user_id, enc_bytes, iv_bytes)
        reload_biometric_cache()  # Hot-reload in-memory cache instantly
    except Exception as e:
        app.logger.error(f"[FACE_SERVICE] Error saving face embedding: {str(e)}")
        return jsonify({"success": False, "message": "Failed to save face embedding to database."}), 500

    log_auth_attempt(user_id, True, 1.0, ip_address, True)

    app.logger.info(f"[FACE_SERVICE] 3D Multi-Angle Face registered successfully for user {user_id} ({len(extracted_embeddings)} poses)")
    return jsonify({
        "success": True,
        "message": f"3D Multi-Angle Face registered successfully ({len(extracted_embeddings)} angles fused).",
        "data": {
            "user_id": user_id,
            "registered": True,
            "poses_captured": len(extracted_embeddings),
            "model_version": MODEL_VERSION,
            "embedding_dim": EMBEDDING_DIM
        }
    }), 200

@app.route('/identify', methods=['POST'])
def identify_user_face():
    ip_address = request.remote_addr or '127.0.0.1'

    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image file provided"}), 400

    file = request.files['image']
    image_bytes = file.read()

    # 1. Liveness check
    liveness_ok, liveness_msg = check_liveness(image_bytes)
    if not liveness_ok:
        return jsonify({
            "success": False,
            "message": liveness_msg or "Liveness verification failed."
        }), 400

    # 2. Extract embedding vector (sub-10ms)
    try:
        live_embedding = extract_embedding_from_image(image_bytes)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

    # 3. High-Speed In-Memory Vector Search (< 1ms)
    global CACHE_INITIALIZED, IN_MEMORY_EMBEDDINGS
    if not CACHE_INITIALIZED or len(IN_MEMORY_EMBEDDINGS) == 0:
        reload_biometric_cache()

    result = identify_face(live_embedding, IN_MEMORY_EMBEDDINGS)

    # 4. Instant Response
    if not result["matched"]:
        return jsonify({
            "success": False,
            "message": "Face authentication failed. No matching registered account found.",
            "data": {
                "matched": False,
                "confidence": result["confidence"],
                "model_version": MODEL_VERSION
            }
        }), 401

    return jsonify({
        "success": True,
        "message": "Face identification successful.",
        "data": {
            "matched": True,
            "user_id": result["user_id"],
            "confidence": result["confidence"],
            "liveness_passed": True,
            "model_version": MODEL_VERSION,
            "embedding_dim": EMBEDDING_DIM
        }
    }), 200

if __name__ == '__main__':
    print("==============================================================")
    print("  STARTING ULTRA-FAST PYTHON FACE BIOMETRICS SERVICE (5001)   ")
    print("==============================================================")
    reload_biometric_cache()
    app.run(host='0.0.0.0', port=5001, debug=False)
