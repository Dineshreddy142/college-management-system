import os
import numpy as np

# Configurable 1:1 Verification & Duplicate Thresholds (Customizable via environment variables)
# SFace recommended cosine similarity threshold for zero false positives is 0.52
BIOMETRIC_MATCH_THRESHOLD = float(os.getenv("BIOMETRIC_MATCH_THRESHOLD", "0.52"))
DUPLICATE_THRESHOLD = float(os.getenv("BIOMETRIC_DUPLICATE_THRESHOLD", "0.48"))

def cosine_similarity(vec1, vec2):
    """
    Computes dimension-safe normalized cosine similarity between two vector arrays.
    Returns float value in range [-1.0, 1.0]
    """
    v1 = np.array(vec1, dtype=np.float32).flatten()
    v2 = np.array(vec2, dtype=np.float32).flatten()

    min_len = min(len(v1), len(v2))
    if min_len == 0:
        return 0.0

    v1 = v1[:min_len]
    v2 = v2[:min_len]

    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return float(np.dot(v1, v2) / (norm1 * norm2))

def verify_face_1to1(live_embedding, stored_embedding, threshold: float = None):
    """
    Performs strict 1:1 biometric identity verification against a single user's template.
    Returns: dict {"verified": bool, "similarity": float, "threshold": float}
    """
    effective_threshold = float(threshold) if threshold is not None else BIOMETRIC_MATCH_THRESHOLD
    sim = cosine_similarity(live_embedding, stored_embedding)
    verified = bool(sim >= effective_threshold)

    return {
        "verified": verified,
        "similarity": float(sim),
        "threshold": effective_threshold
    }

def check_duplicate_face(target_embedding, stored_embeddings, exclude_user_id=None):
    """
    Checks if target_embedding matches any existing stored face template in database.
    stored_embeddings: list of tuples (user_id, decrypted_embedding_array)
    Returns: (is_duplicate: bool, matched_user_id: int | None, max_similarity: float)
    """
    max_sim = 0.0
    duplicate_user_id = None

    for user_id, stored_emb in stored_embeddings:
        if exclude_user_id is not None and int(user_id) == int(exclude_user_id):
            continue

        sim = cosine_similarity(target_embedding, stored_emb)
        if sim > max_sim:
            max_sim = sim
            if sim >= DUPLICATE_THRESHOLD:
                duplicate_user_id = user_id

    is_duplicate = duplicate_user_id is not None
    return is_duplicate, duplicate_user_id, max_sim

def identify_face(live_embedding, stored_embeddings, threshold: float = None):
    """
    Identifies if live_embedding belongs to any user in stored_embeddings.
    Returns: dict {"matched": bool, "user_id": int | None, "confidence": float, "threshold": float}
    """
    effective_threshold = float(threshold) if threshold is not None else BIOMETRIC_MATCH_THRESHOLD
    best_user_id = None
    best_sim = 0.0

    for user_id, stored_emb in stored_embeddings:
        sim = cosine_similarity(live_embedding, stored_emb)
        if sim > best_sim:
            best_sim = sim
            if sim >= effective_threshold:
                best_user_id = user_id

    matched = best_user_id is not None and best_sim >= effective_threshold

    return {
        "matched": matched,
        "user_id": best_user_id,
        "confidence": float(best_sim),
        "threshold": effective_threshold
    }
