import time
import os
import sys

# Set module path
sys.path.insert(0, os.path.dirname(__file__))

from security import (
    check_biometric_security,
    record_biometric_success,
    record_biometric_failure,
    MAX_FAILED_ATTEMPTS,
    TEMPORARY_LOCKOUT_SECONDS
)

def run_phase6_tests():
    print("========================================================================")
    print("   PHASE 6: BIOMETRIC SECURITY PROTECTION & RATE LIMITING SUITE")
    print("========================================================================")

    test_user = "security_test_user@college.edu"
    test_ip = "192.168.1.100"

    # --- TEST 1: NORMAL FIRST REQUEST ALLOWED ---
    print("\n--- TEST 1: Initial Biometric Access Granted ---")
    allowed1, msg1, meta1 = check_biometric_security(test_user, test_ip)
    print(f"Result: allowed={allowed1}, delay={meta1.get('delay_applied', 0):.2f}s")
    assert allowed1 is True, "First request should be immediately allowed"
    print("PASS: Clean initial biometric access granted with 0 delay.")

    # --- TEST 2: PROGRESSIVE DELAY ON CONSECUTIVE FAILURES ---
    print("\n--- TEST 2: Progressive Delay Throttling ---")
    for i in range(1, 4):
        record_biometric_failure(test_user, test_ip)
        start = time.time()
        allowed, _, meta = check_biometric_security(test_user, test_ip)
        elapsed = time.time() - start
        print(f"Failure #{i} -> Progressive Delay Applied: {meta.get('delay_applied', 0):.3f}s (Actual sleep: {elapsed:.3f}s)")
        assert allowed is True, f"Request #{i} should still be allowed with throttling"
        assert meta.get('delay_applied', 0) > 0, "Progressive delay should increase"
    print("PASS: Progressive delay successfully throttles brute-force speed.")

    # --- TEST 3: TEMPORARY LOCKOUT AFTER 5 REPEATED FAILURES ---
    print("\n--- TEST 3: Temporary Lockout Enforcement (Max 5 Failures) ---")
    record_biometric_failure(test_user, test_ip) # 4th failure
    res5 = record_biometric_failure(test_user, test_ip) # 5th failure
    print(f"5th Failure Result: user_locked={res5['user_locked']}, lockout_seconds={res5['lockout_seconds']}")
    assert res5['user_locked'] is True, "User account should trigger temporary lockout at 5 failures"

    # Subsequent request MUST be blocked
    allowed_locked, msg_locked, meta_locked = check_biometric_security(test_user, test_ip)
    print(f"Locked Attempt: allowed={allowed_locked}, message='{msg_locked}'")
    assert allowed_locked is False and meta_locked.get("error_code") == "USER_LOCKED", "Locked attempt was not blocked!"
    print("PASS: Temporary lockout enforced. Account protected against biometric credential stuffing.")

    # --- TEST 4: PER-IP BURST RATE LIMITING ---
    print("\n--- TEST 4: Per-IP Burst Rate Limiting ---")
    burst_ip = "10.0.0.99"
    # Send 31 rapid requests
    for _ in range(30):
        check_biometric_security(None, burst_ip)
    
    # 31st request should trigger IP rate limit
    allowed_burst, msg_burst, meta_burst = check_biometric_security(None, burst_ip)
    print(f"31st Request: allowed={allowed_burst}, message='{msg_burst}'")
    assert allowed_burst is False and meta_burst.get("error_code") == "IP_RATE_LIMITED", "IP burst rate limit failed!"
    print("PASS: Per-IP burst rate limit enforced (30 requests/minute max).")

    # --- TEST 5: SESSION RATE LIMITING ---
    print("\n--- TEST 5: Liveness Session Rate Limiting ---")
    test_session = "sess_xyz_12345"
    for _ in range(10):
        check_biometric_security(None, "127.0.0.1", session_id=test_session)
    
    # 11th request on same session
    allowed_sess, msg_sess, meta_sess = check_biometric_security(None, "127.0.0.1", session_id=test_session)
    print(f"11th Session Request: allowed={allowed_sess}, message='{msg_sess}'")
    assert allowed_sess is False and meta_sess.get("error_code") == "SESSION_RATE_LIMITED", "Session limit failed!"
    print("PASS: Liveness session rate limit enforced.")

    # --- TEST 6: SUCCESS RESET & NON-PERMANENT LOCKOUT SAFETY ---
    print("\n--- TEST 6: Non-Permanent Account Safety & Success Reset ---")
    # Reset user on valid password / biometric login
    record_biometric_success(test_user, test_ip)
    allowed_reset, _, meta_reset = check_biometric_security(test_user, test_ip)
    print(f"Post-Success Access: allowed={allowed_reset}, delay={meta_reset.get('delay_applied', 0):.2f}s")
    assert allowed_reset is True, "Account should be fully unlocked after success reset"
    print("PASS: Account is not permanently locked. Legitimate users retain password fallback access.")

    print("\n========================================================================")
    print("   ALL PHASE 6 BIOMETRIC SECURITY PROTECTION TESTS PASSED!")
    print("========================================================================")

if __name__ == '__main__':
    run_phase6_tests()
