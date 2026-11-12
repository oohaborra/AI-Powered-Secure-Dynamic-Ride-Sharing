
import os
import numpy as np
import pandas as pd

from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
import joblib

# Project paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TRAIN_DIR = os.path.join(BASE_DIR, "imgs", "train")

MODEL_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODEL_DIR, exist_ok=True)
# Training settings
IMAGE_SIZE = (32, 32)
SAMPLES_PER_CLASS = 200

features = []
labels = []

print("Loading driver images...")

for class_name in sorted(os.listdir(TRAIN_DIR)):
    class_path = os.path.join(TRAIN_DIR, class_name)

    if not os.path.isdir(class_path):
        continue

    image_files = [
        f for f in os.listdir(class_path)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    # Use a manageable sample from each class
    image_files = image_files[:SAMPLES_PER_CLASS]

    print(f"{class_name}: {len(image_files)} images")

    for image_name in image_files:
        image_path = os.path.join(class_path, image_name)

        try:
            image = Image.open(image_path).convert("RGB")
            image = image.resize(IMAGE_SIZE)

            image_array = np.asarray(image, dtype=np.float32) / 255.0

            features.append(image_array.flatten())
            labels.append(class_name)

        except Exception as error:
            print("Skipped:", image_path, error)

if not features:
    raise RuntimeError(
        "No images found. Check data/train/c0 to data/train/c9."
    )

X = np.asarray(features, dtype=np.float32)
y = np.asarray(labels)

print("\nTotal images loaded:", len(X))
print("Feature shape:", X.shape)

# Split data for baseline evaluation
X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining Random Forest model...")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_val)

accuracy = accuracy_score(y_val, predictions)

print("\nValidation accuracy:", round(accuracy * 100, 2), "%")
print("\nClassification report:")
print(classification_report(y_val, predictions))

# Save model
model_path = os.path.join(MODEL_DIR, "driver_safety_model.pkl")
joblib.dump(model, model_path)

# Save class names
classes_path = os.path.join(MODEL_DIR, "classes.txt")
with open(classes_path, "w") as file:
    file.write("\n".join(model.classes_))

print("\nModel saved:", model_path)
print("Classes saved:", classes_path)
print("\nTraining completed!")
