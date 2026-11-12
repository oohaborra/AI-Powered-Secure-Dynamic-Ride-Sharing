
import os
import sys
import joblib
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "driver_safety_model.pkl")

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
    print("Loading model...")

    model = joblib.load(MODEL_PATH)

    print("Loading image...")
    image = Image.open(image_path).convert("RGB")
    image = image.resize((32, 32))

    features = np.asarray(
        image, dtype=np.float32
    ).flatten().reshape(1, -1) / 255.0

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    print("\n===== DRIVER SAFETY RESULT =====")
    print("Detected:", CLASS_NAMES.get(prediction, prediction))
    print("Confidence:", round(max(probabilities) * 100, 2), "%")

    if prediction == "c0":
        print("Status: Safe behaviour predicted")
    else:
        print("Status: Potential distraction predicted")

if __name__ == "__main__":
    print("Safety detection started")

    if len(sys.argv) < 2:
        print("Usage: python predict_safety.py image_path")
        sys.exit(1)

    predict_safety(sys.argv[1])
