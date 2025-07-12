const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'visualizer')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));
app.use(express.json());

app.post('/reset-simulation', (req, res) => {
    console.log('[/reset-simulation] Received reset request.');
    const dataDir = path.join(__dirname, 'visualizer', 'data');

    console.log('[/reset-simulation] Reading data directory:', dataDir);
    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error("[/reset-simulation] Error reading data directory:", err);
            return res.status(500).send('Error resetting simulation');
        }

        const jsonFiles = files.filter(file => file.endsWith('.json'));
        console.log('[/reset-simulation] Found JSON files to delete:', jsonFiles);

        if (jsonFiles.length === 0) {
            console.log('[/reset-simulation] No JSON files to delete. Proceeding to run trainer.');
            // If no files to delete, directly run the trainer
            execTrainerAndRespond(res);
            return;
        }

        let filesDeleted = 0;
        jsonFiles.forEach(file => {
            fs.unlink(path.join(dataDir, file), err => {
                if (err) {
                    console.error("[/reset-simulation] Error deleting file:", file, err);
                } else {
                    console.log("[/reset-simulation] Deleted file:", file);
                }
                filesDeleted++;
                if (filesDeleted === jsonFiles.length) {
                    console.log('[/reset-simulation] All JSON files processed. Running trainer.');
                    execTrainerAndRespond(res);
                }
            });
        });
    });

    function execTrainerAndRespond(res) {
        console.log('[/reset-simulation] Executing trainer/run.js...');
        exec('node trainer/run.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`[/reset-simulation] exec error: ${error}`);
                return res.status(500).send('Error running trainer');
            }
            console.log(`[/reset-simulation] stdout: ${stdout}`);
            console.error(`[/reset-simulation] stderr: ${stderr}`);
            console.log('[/reset-simulation] Trainer finished. Sending response.');
            // Add a small delay to ensure files are written before client reloads
            setTimeout(() => {
                res.send('Simulation reset and training started');
            }, 1000); // 1 second delay
        });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});