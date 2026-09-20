import unittest
import numpy as np
import cv2
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from face_extraction import (
    extract_embedding_from_image,
    NoFaceDetectedError,
    MultipleFacesDetectedError,
    LowResolutionFaceError
)

class TestQualityValidator(unittest.TestCase):

    def test_empty_buffer(self):
        with self.assertRaises(NoFaceDetectedError):
            extract_embedding_from_image(b'')

    def test_low_resolution_buffer(self):
        # Create tiny 20x20 image
        tiny_img = np.zeros((20, 20, 3), dtype=np.uint8)
        _, encoded = cv2.imencode('.jpg', tiny_img)
        with self.assertRaises(LowResolutionFaceError):
            extract_embedding_from_image(encoded.tobytes())

    def test_no_face_in_blank_canvas(self):
        # Create 200x200 black image
        blank = np.zeros((200, 200, 3), dtype=np.uint8)
        _, encoded = cv2.imencode('.jpg', blank)
        with self.assertRaises(NoFaceDetectedError):
            extract_embedding_from_image(encoded.tobytes())

if __name__ == '__main__':
    unittest.main()
