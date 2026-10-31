"""Download and verify the official OpenCV YuNet and SFace ONNX models."""

import hashlib
from pathlib import Path
from urllib.request import urlretrieve

BASE = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE / "models"
MODELS = {
    "face_detection_yunet_2023mar.onnx": (
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    ),
    "face_recognition_sface_2021dec.onnx": (
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
    ),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run() -> None:
    MODEL_DIR.mkdir(exist_ok=True)
    for filename, (url, expected_hash) in MODELS.items():
        destination = MODEL_DIR / filename
        if destination.exists() and sha256(destination) == expected_hash:
            print(f"Already downloaded and verified: {filename}")
            continue
        temporary = destination.with_suffix(".onnx.part")
        temporary.unlink(missing_ok=True)
        print(f"Downloading {filename}…")
        urlretrieve(url, temporary)
        actual_hash = sha256(temporary)
        if actual_hash != expected_hash:
            temporary.unlink(missing_ok=True)
            raise RuntimeError(f"Checksum verification failed for {filename}; download it again")
        temporary.replace(destination)
        print(f"Saved and verified: {destination}")


if __name__ == "__main__":
    run()
