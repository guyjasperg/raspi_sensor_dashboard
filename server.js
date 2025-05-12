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

  // Track specific sensor contexts
  let currentAdapter = null;

  lines.forEach((line) => {
    // Adapter detection
    const adapterMatch = line.match(
      /^(\w+(?:\s+\w+)*)\s*:\s*(?:Adapter|ISA adapter|Virtual device)/
    );
    if (adapterMatch) {
      currentAdapter = adapterMatch[1];
    }

    // Temperature parsing with adapter context
    const tempMatch = line.match(/(\w+\d*):\s*\+?(\d+\.\d+)\s*°?C\s*/);
    if (tempMatch) {
      const sensorName = currentAdapter
        ? `${currentAdapter} - ${tempMatch[1]}`
        : tempMatch[1];
      sensors[sensorName] = parseFloat(tempMatch[2]);
    }

    // Voltage parsing
    const voltMatch = line.match(/(\w+\d*)\s*:\s*(\d+\.\d+)\s*V/);
    if (voltMatch) {
      sensors[voltMatch[1]] = parseFloat(voltMatch[2]);
    }

    // Voltage parsing for millivolts
    const mVoltMatch = line.match(/(\w+\d*)\s*:\s*(\d+\.\d+)\s*mV/);
    if (mVoltMatch) {
      sensors[mVoltMatch[1]] = parseFloat(mVoltMatch[2]) / 1000;
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
