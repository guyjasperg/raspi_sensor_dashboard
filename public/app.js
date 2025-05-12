class SensorDashboard {
  constructor() {
    this.sensorReadingsContainer = document.getElementById("sensor-readings");
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Fetch sensors immediately and then set up periodic updates
    this.fetchSensorReadings();
    setInterval(() => this.fetchSensorReadings(), 5000); // Update every 5 seconds
  }

  async fetchSensorReadings() {
    try {
      const response = await fetch("/api/sensors");
      const sensorData = await response.json();
      this.updateDashboard(sensorData);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      this.showErrorState();
    }
  }

  updateDashboard(sensorData) {
    // Clear previous readings
    this.sensorReadingsContainer.innerHTML = "";

    // Create sensor cards
    Object.entries(sensorData).forEach(([sensorName, value]) => {
      const sensorCard = this.createSensorCard(sensorName, value);
      this.sensorReadingsContainer.appendChild(sensorCard);
    });
  }

  createSensorCard(name, value) {
    const card = document.createElement("div");
    card.className = "sensor-card";

    const sensorName = document.createElement("div");
    sensorName.className = "sensor-name";
    sensorName.textContent = name;

    const sensorValue = document.createElement("div");
    sensorValue.className = "sensor-value";
    sensorValue.textContent = this.formatValue(value, name);

    // Add warning class for high temperatures or other critical values
    if (
      (name.toLowerCase().includes("temp") && value > 60) ||
      (name.toLowerCase().includes("fan") && value === 0)
    ) {
      sensorValue.classList.add("warning");
    } else {
      sensorValue.classList.add("normal");
    }

    card.appendChild(sensorName);
    card.appendChild(sensorValue);

    return card;
  }

  formatValue(value, name) {
    // Format value based on sensor type
    if (name.toLowerCase().includes("temp")) {
      return `${value}°C`;
    } else if (name.toLowerCase().includes("volt")) {
      return `${value.toFixed(2)} V`;
    } else if (name.toLowerCase().includes("fan")) {
      return `${value} RPM`;
    }
    return value.toString();
  }

  showErrorState() {
    this.sensorReadingsContainer.innerHTML = `
            <div class="sensor-card warning">
                <div class="sensor-name">Error</div>
                <div class="sensor-value">Unable to fetch sensor data</div>
            </div>
        `;
  }
}

// Initialize the dashboard when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SensorDashboard();
});
