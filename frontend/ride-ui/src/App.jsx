
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function App() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [ride, setRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [driverId, setDriverId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");
  const [safetyResult, setSafetyResult] = useState(null);
  const [safetyImage, setSafetyImage] = useState(null);

  // Load previous rides
  const loadRides = async () => {
    try {
      const response = await fetch(`${API}/rides`);

      if (!response.ok) {
        throw new Error("Unable to load rides");
      }

      const data = await response.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Ride loading error:", error);
    }
  };

  useEffect(() => {
    loadRides();
  }, []);

  // Book a ride
  const requestRide = async (e) => {
    e.preventDefault();

    if (!pickup.trim() || !destination.trim()) {
      setMessage("Please enter pickup and destination.");
      return;
    }

    setLoading(true);
    setMessage("");
    setRide(null);

    try {
      // Find an available driver
      const matchResponse = await fetch(`${API}/match-driver`);

      if (!matchResponse.ok) {
        throw new Error("Driver matching failed.");
      }

      const matchData = await matchResponse.json();

      const matchedDriverId =
        matchData.driver_id ??
        matchData.id ??
        matchData.driver?.id;

      if (!matchedDriverId) {
        throw new Error("No available driver found.");
      }

      setDriverId(matchedDriverId);

      // Demo coordinates for the selected locations
      const params = new URLSearchParams({
        passenger_id: "1",
        driver_id: String(matchedDriverId),
        pickup_latitude: "17.3850",
        pickup_longitude: "78.4867",
        destination_latitude: "17.4000",
        destination_longitude: "78.5000",
        status: "requested",
        fare: "250",
        distance: "45",
        estimated_time: "90",
      });

      const bookingResponse = await fetch(
        `${API}/rides?${params.toString()}`,
        {
          method: "POST",
        }
      );

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(
          errorData.detail || "Ride booking failed."
        );
      }

      const bookingData = await bookingResponse.json();

      setRide(bookingData);
      setMessage("Ride booked successfully!");

      await loadRides();
    } catch (error) {
      setMessage(error.message || "Unable to book ride.");
    } finally {
      setLoading(false);
    }
  };

  // Get current GPS location and update driver location
  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      setGpsMessage("GPS is not supported by this browser.");
      return;
    }

    const selectedDriverId = ride?.driver_id ?? driverId;

    if (!selectedDriverId) {
      setGpsMessage("Please book a ride and find a driver first.");
      return;
    }

    setGpsLoading(true);
    setGpsMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const params = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
          });

          const response = await fetch(
            `${API}/drivers/${selectedDriverId}/location?${params}`,
            {
              method: "POST",
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.detail || "Location update failed."
            );
          }

          setGpsMessage(
            `GPS updated successfully! Latitude: ${latitude.toFixed(
              5
            )}, Longitude: ${longitude.toFixed(5)}`
          );
        } catch (error) {
          setGpsMessage(error.message);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        let errorMessage = "Unable to get GPS location.";

        if (error.code === 1) {
          errorMessage =
            "Location permission denied. Allow location access in browser settings.";
        } else if (error.code === 2) {
          errorMessage =
            "Current location is unavailable. Check your device location settings.";
        } else if (error.code === 3) {
          errorMessage =
            "GPS timeout. Try again or use a device with location enabled.";
        }

        setGpsMessage(errorMessage);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  };

  // Driver safety image detection
  const detectDriverSafety = async (e) => {
    e.preventDefault();

    if (!safetyImage) {
      setSafetyResult({
        error: "Please select a driver image first.",
      });
      return;
    }

    setSafetyLoading(true);
    setSafetyResult(null);

    try {
      const formData = new FormData();
      formData.append("file", safetyImage);

      const response = await fetch(
        `${API}/detect-driver-safety`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Driver safety detection failed."
        );
      }

      setSafetyResult(data);
    } catch (error) {
      setSafetyResult({
        error: error.message,
      });
    } finally {
      setSafetyLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>AI-Powered Secure Dynamic Ride-Sharing</h1>
        <p>Smart Matching | GPS Tracking | Driver Safety</p>
      </header>

      <main style={styles.container}>
        {/* Ride Booking */}
        <section style={styles.card}>
          <h2>Book Your Ride</h2>

          <form onSubmit={requestRide}>
            <label style={styles.label}>Pickup Location</label>

            <input
              style={styles.input}
              type="text"
              placeholder="Enter pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />

            <label style={styles.label}>
              Destination
            </label>

            <input
              style={styles.input}
              type="text"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />

            <button
              style={styles.button}
              type="submit"
              disabled={loading}
            >
              {loading ? "Booking..." : "Request Ride"}
            </button>
          </form>

          {message && (
            <p style={styles.message}>{message}</p>
          )}

          {ride && (
            <div style={styles.result}>
              <h3>Ride Details</h3>
              <p>Ride ID: {ride.id}</p>
              <p>Driver ID: {ride.driver_id}</p>
              <p>Status: {ride.status}</p>
              <p>Fare: ₹{ride.fare ?? 250}</p>
            </div>
          )}
        </section>

        {/* GPS Tracking */}
        <section style={styles.card}>
          <h2>GPS Location Tracking</h2>

          <p>
            Get the current browser device location and update
            the matched driver's saved location.
          </p>

          <button
            style={styles.button}
            onClick={startGPSTracking}
            disabled={gpsLoading}
          >
            {gpsLoading ? "Getting Location..." : "Update GPS Location"}
          </button>

          {gpsMessage && (
            <p style={styles.message}>{gpsMessage}</p>
          )}
        </section>

        {/* Driver Safety Detection */}
        <section style={styles.card}>
          <h2>AI Driver Safety Detection</h2>

          <p>
            Upload a driver image to classify the driving
            behaviour using the trained model.
          </p>

          <form onSubmit={detectDriverSafety}>
            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setSafetyImage(e.target.files[0] || null)
              }
            />

            <button
              style={styles.button}
              type="submit"
              disabled={safetyLoading}
            >
              {safetyLoading
                ? "Analyzing..."
                : "Detect Driver Behaviour"}
            </button>
          </form>

          {safetyResult && (
            <div style={styles.result}>
              <h3>Safety Detection Result</h3>

              {safetyResult.error ? (
                <p>{safetyResult.error}</p>
              ) : (
                <>
                  <p>
                    Behaviour: {safetyResult.behaviour}
                  </p>
                  <p>
                    Confidence:{" "}
                    {safetyResult.confidence != null
                      ? `${(
                          Number(safetyResult.confidence) <= 1
                            ? Number(safetyResult.confidence) * 100
                            : Number(safetyResult.confidence)
                        ).toFixed(2)}%`
                      : "Not provided"}
                  </p>
                  <p>Status: {safetyResult.status}</p>
                </>
              )}
            </div>
          )}
        </section>

        {/* Ride History */}
        <section style={styles.card}>
          <h2>Ride History</h2>

          <button
            style={styles.secondaryButton}
            onClick={loadRides}
          >
            Refresh Rides
          </button>

          {rides.length === 0 ? (
            <p>No rides available.</p>
          ) : (
            rides.map((item) => (
              <div key={item.id} style={styles.rideItem}>
                <p>Ride ID: {item.id}</p>
                <p>Passenger ID: {item.passenger_id}</p>
                <p>Driver ID: {item.driver_id}</p>
                <p>Status: {item.status}</p>
                <p>Fare: ₹{item.fare}</p>
              </div>
            ))
          )}
        </section>
      </main>

      <footer style={styles.footer}>
        <p>AI-Powered Secure Dynamic Ride-Sharing Project</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "Arial, sans-serif",
    color: "#1e293b",
  },

  header: {
    background: "#123456",
    color: "white",
    padding: "25px 15px",
    textAlign: "center",
  },

  container: {
    maxWidth: "850px",
    margin: "25px auto",
    padding: "0 15px",
  },

  card: {
    background: "white",
    padding: "25px",
    marginBottom: "22px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  label: {
    display: "block",
    marginTop: "15px",
    marginBottom: "7px",
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "13px",
    marginTop: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  secondaryButton: {
    padding: "10px 18px",
    background: "#475569",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  message: {
    marginTop: "15px",
    color: "#1d4ed8",
    overflowWrap: "anywhere",
  },

  result: {
    background: "#eff6ff",
    padding: "15px",
    marginTop: "18px",
    borderRadius: "8px",
    overflowWrap: "anywhere",
  },

  rideItem: {
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 0",
  },

  footer: {
    textAlign: "center",
    padding: "18px",
    background: "#123456",
    color: "white",
  },
};

export default App;
