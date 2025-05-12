class SensorDashboard {
  constructor() {
    this.sensorReadingsContainer = document.getElementById("sensor-readings");
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Fetch sensors and system metrics immediately and then set up periodic updates
    this.fetchSensorReadings();
    this.fetchSystemMetrics();

    // Update intervals
    setInterval(() => this.fetchSensorReadings(), 5000); // Sensors every 5 seconds
    setInterval(() => this.fetchSystemMetrics(), 5000); // System metrics every 5 seconds
  }

  async fetchSensorReadings() {
    try {
      const response = await fetch("/api/sensors");
      const sensorData = await response.json();
      this.updateSensorDashboard(sensorData);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      this.showErrorState("sensors");
    }
  }

  async fetchSystemMetrics() {
    try {
      const response = await fetch("/api/system-metrics");
      const metricsData = await response.json();
      this.updateSystemMetricsDashboard(metricsData);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      this.showErrorState("system-metrics");
    }
  }

  updateSensorDashboard(sensorData) {
    // Create a section for hardware sensors
    const sensorSection = this.createSectionHeader("Hardware Sensors");

    // Create sensor cards
    Object.entries(sensorData).forEach(([sensorName, value]) => {
      const sensorCard = this.createSensorCard(sensorName, value);
      sensorSection.appendChild(sensorCard);
    });

    // Replace existing sensor readings
    const existingSensorSection = document.querySelector(
      '.sensor-section[data-type="hardware-sensors"]'
    );
    if (existingSensorSection) {
      existingSensorSection.replaceWith(sensorSection);
    } else {
      this.sensorReadingsContainer.appendChild(sensorSection);
    }
  }

  updateSystemMetricsDashboard(metricsData) {
    // Create a section for system metrics
    const metricsSection = this.createSectionHeader("System Metrics");

    // Create metric cards
    Object.entries(metricsData).forEach(([metricName, value]) => {
      const metricCard = this.createSensorCard(metricName, value);
      metricsSection.appendChild(metricCard);
    });

    // Replace existing metrics section
    const existingMetricsSection = document.querySelector(
      '.sensor-section[data-type="system-metrics"]'
    );
    if (existingMetricsSection) {
      existingMetricsSection.replaceWith(metricsSection);
    } else {
      this.sensorReadingsContainer.appendChild(metricsSection);
    }
  }

  createSectionHeader(title) {
    const section = document.createElement("div");
    section.className = "sensor-section";
    section.dataset.type = title.toLowerCase().replace(/\s+/g, "-");

    const header = document.createElement("h2");
    header.textContent = title;
    section.appendChild(header);

    return section;
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

    // Add warning class for high temperatures, high usage, etc.
    if (this.shouldHighlight(name, value)) {
      sensorValue.classList.add("warning");
    } else {
      sensorValue.classList.add("normal");
    }

    card.appendChild(sensorName);
    card.appendChild(sensorValue);

    return card;
  }

  formatValue(value, name) {
    // If value is already a string (from system metrics), return it
    if (typeof value === "string") return value;

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

  shouldHighlight(name, value) {
    const nameLower = name.toLowerCase();

    // Temperature warning
    if (nameLower.includes("temp") && value > 60) return true;

    // Disk space warning (over 80% used)
    if (nameLower.includes("disk used %")) {
      const usedPercent = parseFloat(value);
      return !isNaN(usedPercent) && usedPercent > 80;
    }

    // RAM usage warning (over 80%)
    if (nameLower.includes("ram used %")) {
      const usedPercent = parseFloat(value);
      return !isNaN(usedPercent) && usedPercent > 80;
    }

    // CPU load warning (over 80%)
    if (nameLower.includes("cpu total load")) {
      const cpuLoad = parseFloat(value);
      return !isNaN(cpuLoad) && cpuLoad > 80;
    }

    return false;
  }

  showErrorState(type) {
    const errorSection = this.createSectionHeader(`Error - ${type}`);
    const errorCard = this.createSensorCard("Status", "Unable to fetch data");
    errorSection.appendChild(errorCard);

    // Replace or add error section
    const existingSection = document.querySelector(
      `.sensor-section[data-type="${type}"]`
    );
    if (existingSection) {
      existingSection.replaceWith(errorSection);
    } else {
      this.sensorReadingsContainer.appendChild(errorSection);
    }
  }
}

// Initialize the dashboard when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SensorDashboard();
});
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
