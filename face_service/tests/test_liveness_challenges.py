import unittest
import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from liveness import create_liveness_challenge, verify_liveness_challenge, CHALLENGE_STORE

class TestLivenessChallenges(unittest.TestCase):

    def test_challenge_creation(self):
        challenge = create_liveness_challenge()
        self.assertIn("session_id", challenge)
        self.assertIn("challenge", challenge)
        self.assertIn("instruction", challenge)
        self.assertIn(challenge["session_id"], CHALLENGE_STORE)

    def test_invalid_session_verification(self):
        passed, msg, data = verify_liveness_challenge("non-existent-session-id", [b'frame'], None)
        self.assertFalse(passed)
        self.assertEqual(data.get("error_code"), "INVALID_SESSION")

    def test_replay_attack_prevention(self):
        challenge = create_liveness_challenge()
        session_id = challenge["session_id"]
        
        # Mark used manually to simulate second attempt
        CHALLENGE_STORE[session_id]["used"] = True
        
        passed, msg, data = verify_liveness_challenge(session_id, [b'frame'], None)
        self.assertFalse(passed)
        self.assertEqual(data.get("error_code"), "CHALLENGE_REUSED")

if __name__ == '__main__':
    unittest.main()
