
import os
import sys
import joblib
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR, "models", "driver_safety_model.pkl"
)

IMAGE_SIZE = (32, 32)

CLASS_NAMES = {
    "c0": "Safe Driving",
    "c1": "Texting - Right Hand",
    "c2": "Talking on Phone - Right Hand",
    "c3": "Texting - Left Hand",
    "c4": "Talking on Phone - Left Hand",
    "c5": "Operating Radio",
    "c6": "Drinking",
    "c7": "Reaching Behind",
    "c8": "Hair or Makeup",
    "c9": "Talking to Passenger"
}

def predict_safety(image_path):
    if not os.path.exists(image_path):
        print("Image not found:", image_path)
        return

    model = joblib.load(MODEL_PATH)

    image = Image.open(image_path).convert("RGB")
    image = image.resize(IMAGE_SIZE)

    image_array = np.asarray(
        image, dtype=np.float32
    ) / 255.0

    features = image_array.flatten().reshape(1, -1)

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    confidence = max(probabilities) * 100
    behaviour = CLASS_NAMES.get(prediction, prediction)

    print("\n--- DRIVER SAFETY RESULT ---")
    print("Detected behaviour:", behaviour)
    print("Model confidence:", round(confidence, 2), "%")

    if prediction == "c0":
        print("Result: No distraction detected in this image.")
    else:
        print("Result: Potential distracted-driving behaviour detected.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage: python predict_safety.py "
            "path_to_driver_image.jpg"
        )
    else:
        predict_safety(sys.argv[1])
