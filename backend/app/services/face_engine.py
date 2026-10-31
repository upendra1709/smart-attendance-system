import threading
from pathlib import Path
import cv2
import numpy as np
from app.core.config import FACE_MODEL_DIR


class FaceEngineError(ValueError):
    pass


class FaceModelsMissingError(FaceEngineError):
    """The ONNX model files are not on the server: a setup problem, not something the user did."""


class FaceEngine:
    """OpenCV YuNet detector + SFace embedding recognizer.

    Raw images never leave this service. Only normalized float32 embeddings
    are returned to the API layer for database storage/comparison.
    """

    def __init__(self, model_dir: Path = FACE_MODEL_DIR):
        detection_path = model_dir / "face_detection_yunet_2023mar.onnx"
        recognition_path = model_dir / "face_recognition_sface_2021dec.onnx"
        missing = [str(path) for path in (detection_path, recognition_path) if not path.exists()]
        if missing:
            raise FaceModelsMissingError(
                "Face model files are missing. Run 'python scripts/download_face_models.py'. "
                + ", ".join(missing)
            )
        self.detector = cv2.FaceDetectorYN_create(
            str(detection_path), "", (320, 320), 0.85, 0.3, 5000
        )
        self.recognizer = cv2.FaceRecognizerSF_create(str(recognition_path), "")

    def detect(self, image: np.ndarray) -> np.ndarray:
        height, width = image.shape[:2]
        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(image)
        if faces is None or len(faces) == 0:
            raise FaceEngineError("No face detected. Center one face in good lighting and try again.")
        return faces

    def embedding(self, image: np.ndarray, require_single: bool = True) -> np.ndarray:
        faces = self.detect(image)
        if require_single and len(faces) != 1:
            raise FaceEngineError("Exactly one face must be visible. Remove additional faces and try again.")
        face = max(faces, key=lambda item: float(item[2] * item[3]))
        aligned = self.recognizer.alignCrop(image, face)
        feature = self.recognizer.feature(aligned).flatten().astype(np.float32)
        norm = float(np.linalg.norm(feature))
        if norm == 0:
            raise FaceEngineError("A usable face embedding could not be generated")
        return feature / norm

    @staticmethod
    def similarity(first: np.ndarray, second: np.ndarray) -> float:
        return float(np.dot(first, second))


_engine = None
_engine_lock = threading.Lock()


def get_face_engine() -> FaceEngine:
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                _engine = FaceEngine()
    return _engine


def face_models_ready() -> bool:
    """True when both ONNX model files exist (used by the health check)."""
    return all(
        (FACE_MODEL_DIR / name).exists()
        for name in ("face_detection_yunet_2023mar.onnx", "face_recognition_sface_2021dec.onnx")
    )


def embedding_to_bytes(embedding: np.ndarray) -> bytes:
    return embedding.astype(np.float32).tobytes()


def embedding_from_bytes(data: bytes) -> np.ndarray:
    return np.frombuffer(data, dtype=np.float32)
