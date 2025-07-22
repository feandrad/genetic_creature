const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const dataDir = path.join(__dirname, 'visualizer', 'data');

// Function to run the trainer and create the index file
function runTrainer(callback) {
    console.log('[Server Startup] Executing trainer/run.js...');
    const trainerProcess = spawn('node', ['trainer/run.js'], { stdio: 'inherit' });

    trainerProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`[Server Startup] Trainer process exited with code ${code}`);
            return callback(new Error(`Trainer process exited with code ${code}`));
        }
        console.log('[Server Startup] Trainer finished. Recreating creatures.json index.');

        fs.readdir(dataDir, (err, files) => {
            if (err) {
                console.error("[Server Startup] Error reading data directory after training:", err);
                return callback(err);
            }

            const creatureFiles = files.filter(file => file.startsWith('creature_') && file.endsWith('.json'));
            fs.writeFile(path.join(dataDir, 'creatures.json'), JSON.stringify(creatureFiles, null, 2), (err) => {
                if (err) {
                    console.error("[Server Startup] Error writing creatures.json:", err);
                    return callback(err);
                }
                console.log('[Server Startup] creatures.json index recreated successfully.');
                callback(null);
            });
        });
    });

    trainerProcess.on('error', (err) => {
        console.error(`[Server Startup] Failed to start trainer process: ${err}`);
        callback(err);
    });
}

// Function to initialize data on server startup
function initializeData(callback) {
    console.log('[Server Startup] Checking for data directory...');
    if (!fs.existsSync(dataDir)) {
        console.log('[Server Startup] Data directory not found, creating it.');
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error('[Server Startup] Could not read data directory:', err);
            return callback(err);
        }

        if (files.length === 0) {
            console.log('[Server Startup] Data directory is empty. Running initial training...');
            runTrainer(callback);
        } else {
            console.log('[Server Startup] Data directory is not empty. Server is ready.');
            callback(null); // Data exists, do nothing
        }
    });
}

app.use(express.static(path.join(__dirname, 'visualizer')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));
app.use(express.json());

app.post('/reset-simulation', (req, res) => {
    console.log('[/reset-simulation] Received reset request.');

    console.log('[/reset-simulation] Reading data directory:', dataDir);
    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error("[/reset-simulation] Error reading data directory:", err);
            return res.status(500).send('Error resetting simulation');
        }

        const jsonFiles = files.filter(file => file.endsWith('.json'));
        console.log('[/reset-simulation] Found JSON files to delete:', jsonFiles);

        const deletePromises = jsonFiles.map(file => 
            new Promise((resolve, reject) => {
                fs.unlink(path.join(dataDir, file), err => {
                    if (err) {
                        console.error("[/reset-simulation] Error deleting file:", file, err);
                        reject(err);
                    } else {
                        console.log("[/reset-simulation] Deleted file:", file);
                        resolve();
                    }
                });
            })
        );

        Promise.all(deletePromises).then(() => {
            console.log('[/reset-simulation] All JSON files deleted. Running trainer.');
            runTrainer((err) => {
                if (err) {
                    return res.status(500).send('Error running trainer after reset');
                }
                res.send('Simulation reset and training completed successfully');
            });
        }).catch(err => {
            res.status(500).send('Error deleting old simulation files.');
        });
    });
});

// Start the server after ensuring data is initialized
initializeData((err) => {
    if (err) {
        console.error("Failed to initialize server data. Please check permissions and configurations.");
        process.exit(1);
    }

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
});