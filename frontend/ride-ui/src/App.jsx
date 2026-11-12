
import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

function App() {
  // Ride booking states
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [ride, setRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // GPS states
  const [gpsMessage, setGpsMessage] = useState("");
  const [gpsLocation, setGpsLocation] = useState(null);

  // Driver safety states
  const [safetyImage, setSafetyImage] = useState(null);
  const [safetyResult, setSafetyResult] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  // Load all rides
  const loadRides = async () => {
    try {
      const response = await fetch(`${API}/rides`);

      if (!response.ok) {
        throw new Error("Unable to load rides");
      }

      const data = await response.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load rides error:", error);
    }
  };

  useEffect(() => {
    loadRides();
  }, []);

  // Request a ride
  const requestRide = async () => {
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

      const driverId =
        matchData.driver_id ??
        matchData.id ??
        matchData.driver?.id;

      if (!driverId) {
        throw new Error("No driver ID returned by the matching API.");
      }

      // Demo coordinates: replace with actual geocoded coordinates
      // when pickup and destination geocoding is implemented.
      const params = new URLSearchParams({
        passenger_id: "1",
        driver_id: String(driverId),
        pickup_latitude: "17.3850",
        pickup_longitude: "78.4867",
        destination_latitude: "17.4000",
        destination_longitude: "78.5000",
        status: "requested",
        fare: "250",
        distance: "45",
        estimated_time: "90"
      });

      const rideResponse = await fetch(
        `${API}/rides?${params.toString()}`,
        {
          method: "POST"
        }
      );

      if (!rideResponse.ok) {
        const errorData = await rideResponse.json();
        throw new Error(
          errorData.detail || "Ride booking failed."
        );
      }

      const rideData = await rideResponse.json();

      setRide({
        ...rideData,
        driver_id: rideData.driver_id ?? driverId,
        pickup,
        destination
      });

      setMessage("Ride booked successfully!");
      await loadRides();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get current browser location and update driver location
  const startGPSTracking = () => {
    if (!ride?.driver_id) {
      setGpsMessage("Book a ride with a matched driver first.");
      return;
    }

    if (!navigator.geolocation) {
      setGpsMessage("Geolocation is not supported by this browser.");
      return;
    }

    setGpsMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setGpsLocation({ latitude, longitude });

        try {
          const params = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude)
          });

          const response = await fetch(
            `${API}/drivers/${ride.driver_id}/location?${params}`,
            { method: "POST" }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || "GPS update failed.");
          }

          setGpsMessage("Location updated successfully!");
        } catch (error) {
          setGpsMessage(error.message);
        }
      },
      (error) => {
        setGpsMessage("GPS error: " + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  // AI driver safety detection
  const detectDriverSafety = async () => {
    if (!safetyImage) {
      alert("Please select a driver image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", safetyImage);

    try {
      setSafetyLoading(true);
      setSafetyResult(null);

      const response = await fetch(
        `${API}/detect-driver-safety`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Safety detection failed.");
      }

      setSafetyResult(data);

    } catch (error) {
      alert(error.message);
    } finally {
      setSafetyLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>AI-Powered Secure Dynamic Ride-Sharing</h1>
        <p>Smart Matching | Route Optimization | Driver Safety</p>
      </header>

      {/* Ride Booking */}
      <section style={styles.card}>
        <h2>Book Your Ride</h2>

        <label>Pickup Location</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter pickup location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />

        <label>Destination</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={requestRide}
          disabled={loading}
        >
          {loading ? "Finding Driver..." : "Request Ride"}
        </button>

        {message && <p>{message}</p>}

        {ride && (
          <div style={styles.result}>
            <h3>Ride Details</h3>
            <p>Ride ID: {ride.id ?? "Created"}</p>
            <p>Driver ID: {ride.driver_id}</p>
            <p>Pickup: {ride.pickup}</p>
            <p>Destination: {ride.destination}</p>
            <p>Status: {ride.status ?? "Requested"}</p>
          </div>
        )}
      </section>

      {/* GPS Tracking */}
      <section style={styles.card}>
        <h2>GPS Location Update</h2>

        <p>Update the browser device's current location.</p>

        <button
          style={styles.button}
          onClick={startGPSTracking}
        >
          Get Current GPS Location
        </button>

        {gpsMessage && <p>{gpsMessage}</p>}

        {gpsLocation && (
          <div style={styles.result}>
            <p>Latitude: {gpsLocation.latitude}</p>
            <p>Longitude: {gpsLocation.longitude}</p>

            <a
              href={`https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              View Location on Google Maps
            </a>
          </div>
        )}
      </section>

      {/* AI Driver Safety Detection */}
      <section style={styles.card}>
        <h2>AI Driver Safety Detection</h2>

        <p>
          Upload a driver image to classify possible
          distracted-driving behaviour.
        </p>

        <input
          style={styles.input}
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => {
            setSafetyImage(e.target.files?.[0] || null);
            setSafetyResult(null);
          }}
        />

        {safetyImage && (
          <p>Selected image: {safetyImage.name}</p>
        )}

        <button
          style={styles.button}
          onClick={detectDriverSafety}
          disabled={safetyLoading || !safetyImage}
        >
          {safetyLoading ? "Analyzing Image..." : "Detect Driver Safety"}
        </button>

        {safetyResult && (
          <div style={styles.result}>
            <h3>Safety Detection Result</h3>

            <p>
              <strong>Behaviour:</strong>{" "}
              {safetyResult.behaviour}
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              {safetyResult.confidence}%
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {safetyResult.status}
            </p>
          </div>
        )}

        <p style={styles.note}>
          This is an image-based prediction and does not
          provide continuous driver monitoring.
        </p>
      </section>

      {/* All Booked Rides */}
      <section style={styles.card}>
        <h2>All Booked Rides</h2>

        <button
          style={styles.secondaryButton}
          onClick={loadRides}
        >
          Refresh Rides
        </button>

        {rides.length === 0 ? (
          <p>No rides available.</p>
        ) : (
          rides.map((item, index) => (
            <div key={item.id ?? index} style={styles.result}>
              <p>Ride ID: {item.id}</p>
              <p>Passenger ID: {item.passenger_id}</p>
              <p>Driver ID: {item.driver_id}</p>
              <p>Status: {item.status}</p>
              <p>Fare: {item.fare}</p>
            </div>
          ))
        )}
      </section>

      <footer style={styles.footer}>
        <p>AI-Powered Secure Dynamic Ride-Sharing Project</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    color: "#222"
  },

  header: {
    textAlign: "center",
    background: "#17365d",
    color: "white",
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "20px"
  },

  card: {
    background: "#ffffff",
    padding: "22px",
    marginBottom: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.10)"
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    margin: "10px 0 18px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "15px"
  },

  button: {
    background: "#1769aa",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "8px",
    fontSize: "15px"
  },

  secondaryButton: {
    background: "#555",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  result: {
    background: "#f0f5fa",
    padding: "14px",
    marginTop: "15px",
    borderRadius: "7px",
    overflowWrap: "anywhere"
  },

  note: {
    fontSize: "13px",
    color: "#666",
    marginTop: "15px"
  },

  footer: {
    textAlign: "center",
    padding: "15px",
    color: "#666"
  }
};

export default App;
