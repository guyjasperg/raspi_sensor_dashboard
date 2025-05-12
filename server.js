const express = require("express");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3004;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API endpoint to get sensor readings
app.get("/api/sensors", (req, res) => {
  exec("sensors", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: "Failed to retrieve sensor data" });
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: "Error in sensor command" });
    }

    // Parse sensors output
    const sensorData = parseSensorsOutput(stdout);
    res.json(sensorData);
  });
});

// Function to parse sensors output
function parseSensorsOutput(output) {
  const sensors = {};
  const lines = output.split("\n");

  lines.forEach((line) => {
    // Temperature parsing
    const tempMatch = line.match(/(\w+):\s*\+?(\d+\.\d+)°C\s*/);
    if (tempMatch) {
      sensors[tempMatch[1]] = parseFloat(tempMatch[2]);
    }

    // Voltage parsing
    const voltMatch = line.match(/(\w+\d*)\s*:\s*(\d+\.\d+)\s*V/);
    if (voltMatch) {
      sensors[voltMatch[1]] = parseFloat(voltMatch[2]);
    }

    // Fan speed parsing
    const fanMatch = line.match(/(\w+\d*)\s*:\s*(\d+)\s*RPM/);
    if (fanMatch) {
      sensors[fanMatch[1]] = parseInt(fanMatch[2]);
    }
  });

  return sensors;
}

// Start server
app.listen(PORT, () => {
  console.log(`Sensor Dashboard running on http://localhost:${PORT}`);
});
