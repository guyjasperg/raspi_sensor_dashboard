const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3004;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API endpoint to get system metrics
app.get("/api/system-metrics", (req, res) => {
  Promise.all([getDiskSpace(), getRAMUsage(), getCPULoad()])
    .then(([diskSpace, ramUsage, cpuLoad]) => {
      res.json({
        ...diskSpace,
        ...ramUsage,
        ...cpuLoad,
      });
    })
    .catch((error) => {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ error: "Failed to retrieve system metrics" });
    });
});

// Existing sensors endpoint
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

// Function to get disk space
function getDiskSpace() {
  return new Promise((resolve, reject) => {
    exec("df -h /", (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      const lines = stdout.trim().split("\n");
      const diskInfo = lines[1].split(/\s+/);

      resolve({
        "Disk Total": diskInfo[1],
        "Disk Used": diskInfo[2],
        "Disk Used %": diskInfo[4],
      });
    });
  });
}

// Function to get RAM usage
function getRAMUsage() {
  return new Promise((resolve) => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    resolve({
      "RAM Total": `${(totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      "RAM Used": `${(usedMemory / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      "RAM Used %": `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
    });
  });
}

// Function to get CPU load
function getCPULoad() {
  return new Promise((resolve, reject) => {
    exec('top -bn1 | grep "Cpu(s)"', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      // Parsing CPU usage from top output
      const cpuMatch = stdout.match(
        /(\d+\.\d+)\s*%\s*us,\s*(\d+\.\d+)\s*%\s*sy/
      );

      if (cpuMatch) {
        const userLoad = parseFloat(cpuMatch[1]);
        const systemLoad = parseFloat(cpuMatch[2]);
        const totalLoad = userLoad + systemLoad;

        resolve({
          "CPU User Load": `${userLoad.toFixed(2)}%`,
          "CPU System Load": `${systemLoad.toFixed(2)}%`,
          "CPU Total Load": `${totalLoad.toFixed(2)}%`,
        });
      } else {
        resolve({
          "CPU Load": "Unable to retrieve",
        });
      }
    });
  });
}

// Existing sensors output parsing function
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
