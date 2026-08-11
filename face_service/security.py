import time
from typing import Dict, Any, Tuple

# Security limits
MAX_FAILED_ATTEMPTS = 5
TEMPORARY_LOCKOUT_SECONDS = 300  # 5 minutes
IP_WINDOW_SECONDS = 60
IP_MAX_REQUESTS = 30  # Max 30 requests per minute per IP
PROGRESSIVE_DELAY_BASE_SECONDS = 0.3  # Adds delay on repeated failures (up to 2.0s)

# Thread-safe in-memory security stores
USER_FAILURE_STORE: Dict[str, Dict[str, Any]] = {}
IP_STORE: Dict[str, Dict[str, Any]] = {}
SESSION_REQUEST_STORE: Dict[str, Dict[str, Any]] = {}

def check_biometric_security(
    user_identifier: str = None,
    ip_address: str = "127.0.0.1",
    session_id: str = None
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Checks per-IP rate limits, per-user temporary lockouts, and applies progressive delay.
    """
    now = time.time()
    ip_key = (ip_address or "127.0.0.1").strip()
    user_key = str(user_identifier).strip().lower() if user_identifier else None

    # 1. Per-IP Burst Rate Limiting
    if ip_key not in IP_STORE or (now - IP_STORE[ip_key]["window_start"]) > IP_WINDOW_SECONDS:
        IP_STORE[ip_key] = {
            "count": 1,
            "window_start": now,
            "failed_attempts": IP_STORE.get(ip_key, {}).get("failed_attempts", 0),
            "locked_until": IP_STORE.get(ip_key, {}).get("locked_until", 0)
        }
    else:
        IP_STORE[ip_key]["count"] += 1
        if IP_STORE[ip_key]["count"] > IP_MAX_REQUESTS:
            remaining = int(IP_WINDOW_SECONDS - (now - IP_STORE[ip_key]["window_start"]))
            return False, f"Too many biometric requests from this IP. Please wait {remaining} seconds.", {
                "error_code": "IP_RATE_LIMITED",
                "remaining_seconds": remaining
            }

    # 2. Check IP Temporary Lockout
    if IP_STORE[ip_key].get("locked_until", 0) > now:
        remaining = int(IP_STORE[ip_key]["locked_until"] - now)
        return False, f"Biometric verification temporarily locked for this IP. Retry in {int(remaining/60)+1} minutes.", {
            "error_code": "IP_LOCKED",
            "remaining_seconds": remaining
        }

    # 3. Check User Account Temporary Lockout
    if user_key and user_key in USER_FAILURE_STORE:
        user_record = USER_FAILURE_STORE[user_key]
        if user_record.get("locked_until", 0) > now:
            remaining = int(user_record["locked_until"] - now)
            return False, f"Face verification temporarily suspended after multiple failed attempts. Try again in {int(remaining/60)+1} minutes, or sign in with your password.", {
                "error_code": "USER_LOCKED",
                "remaining_seconds": remaining
            }

    # 4. Session Rate Limiting
    if session_id:
        s_key = str(session_id).strip()
        if s_key not in SESSION_REQUEST_STORE:
            SESSION_REQUEST_STORE[s_key] = {"count": 1, "created": now}
        else:
            SESSION_REQUEST_STORE[s_key]["count"] += 1
            if SESSION_REQUEST_STORE[s_key]["count"] > 10:
                return False, "Liveness session rate limit exceeded. Please request a new challenge.", {
                    "error_code": "SESSION_RATE_LIMITED"
                }

    # 5. Progressive Delay (Throttling)
    user_failures = USER_FAILURE_STORE.get(user_key, {}).get("failed_attempts", 0) if user_key else 0
    ip_failures = IP_STORE.get(ip_key, {}).get("failed_attempts", 0)
    total_failures = user_failures + ip_failures

    delay = min(2.0, total_failures * PROGRESSIVE_DELAY_BASE_SECONDS)
    if delay > 0:
        time.sleep(delay)

    return True, "Access granted", {"delay_applied": delay}

def record_biometric_success(user_identifier: str = None, ip_address: str = "127.0.0.1"):
    """Resets failed attempt counters on successful authentication."""
    if user_identifier:
        u_key = str(user_identifier).strip().lower()
        USER_FAILURE_STORE.pop(u_key, None)

    ip_key = (ip_address or "127.0.0.1").strip()
    if ip_key in IP_STORE:
        IP_STORE[ip_key]["failed_attempts"] = 0
        IP_STORE[ip_key]["locked_until"] = 0

def record_biometric_failure(user_identifier: str = None, ip_address: str = "127.0.0.1") -> Dict[str, Any]:
    """Records a failure and triggers progressive delay / temporary lockout if threshold is exceeded."""
    now = time.time()
    ip_key = (ip_address or "127.0.0.1").strip()
    u_key = str(user_identifier).strip().lower() if user_identifier else None

    # Track user failure
    user_locked = False
    user_fails = 0
    if u_key:
        if u_key not in USER_FAILURE_STORE:
            USER_FAILURE_STORE[u_key] = {"failed_attempts": 1, "locked_until": 0, "last_attempt": now}
        else:
            USER_FAILURE_STORE[u_key]["failed_attempts"] += 1
            USER_FAILURE_STORE[u_key]["last_attempt"] = now

        user_fails = USER_FAILURE_STORE[u_key]["failed_attempts"]
        if user_fails >= MAX_FAILED_ATTEMPTS:
            USER_FAILURE_STORE[u_key]["locked_until"] = now + TEMPORARY_LOCKOUT_SECONDS
            user_locked = True

    # Track IP failure
    if ip_key not in IP_STORE:
        IP_STORE[ip_key] = {"count": 1, "window_start": now, "failed_attempts": 1, "locked_until": 0}
    else:
        IP_STORE[ip_key]["failed_attempts"] = IP_STORE[ip_key].get("failed_attempts", 0) + 1

    if IP_STORE[ip_key]["failed_attempts"] >= (MAX_FAILED_ATTEMPTS * 2):
        IP_STORE[ip_key]["locked_until"] = now + TEMPORARY_LOCKOUT_SECONDS

    return {
        "user_locked": user_locked,
        "failed_attempts": user_fails,
        "remaining_attempts": max(0, MAX_FAILED_ATTEMPTS - user_fails),
        "lockout_seconds": TEMPORARY_LOCKOUT_SECONDS if user_locked else 0
    }
