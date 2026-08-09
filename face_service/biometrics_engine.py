import numpy as np

# Strict Cosine Similarity Threshold for Positive Verified Match (0.0 to 1.0)
MATCH_THRESHOLD = 0.58

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

def check_duplicate_face(target_embedding, stored_embeddings, exclude_user_id=None):
    """
    Checks if target_embedding matches any existing stored face template in database.
    stored_embeddings: list of tuples (user_id, decrypted_embedding_array)
    Returns: (is_duplicate: bool, matched_user_id: int | None, max_similarity: float)
    """
    max_sim = 0.0
    duplicate_user_id = None

    for user_id, stored_emb in stored_embeddings:
        if exclude_user_id is not None and user_id == exclude_user_id:
            continue

        sim = cosine_similarity(target_embedding, stored_emb)
        if sim > max_sim:
            max_sim = sim
            if sim >= MATCH_THRESHOLD:
                duplicate_user_id = user_id

    is_duplicate = duplicate_user_id is not None
    return is_duplicate, duplicate_user_id, max_sim

def identify_face(live_embedding, stored_embeddings):
    """
    Identifies if live_embedding belongs to any user in stored_embeddings.
    Returns: dict {"matched": bool, "user_id": int | None, "confidence": float}
    """
    best_user_id = None
    best_sim = 0.0

    for user_id, stored_emb in stored_embeddings:
        sim = cosine_similarity(live_embedding, stored_emb)
        if sim > best_sim:
            best_sim = sim
            if sim >= MATCH_THRESHOLD:
                best_user_id = user_id

    matched = best_user_id is not None and best_sim >= MATCH_THRESHOLD

    return {
        "matched": matched,
        "user_id": best_user_id,
        "confidence": float(best_sim)
    }
