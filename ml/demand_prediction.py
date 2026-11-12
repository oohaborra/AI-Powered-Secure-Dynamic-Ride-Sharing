
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# Sample historical ride demand data
data = {
    "hour": [8, 9, 10, 11, 12, 13, 17, 18, 19, 20,
             8, 9, 10, 17, 18, 19],
    "day": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            2, 2, 2, 2, 2, 2],
    "zone": [1, 1, 2, 2, 1, 2, 1, 1, 2, 2,
             1, 2, 1, 2, 1, 2],
    "demand": [10, 15, 8, 9, 12, 7, 25, 30, 20, 18,
               12, 10, 9, 22, 28, 19]
}

df = pd.DataFrame(data)

X = df[["hour", "day", "zone"]]
y = df["demand"]

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

# Predict demand for a future time
future = pd.DataFrame({
    "hour": [18],
    "day": [3],
    "zone": [1]
})

prediction = model.predict(future)

print("Predicted ride demand:", round(prediction[0]))
