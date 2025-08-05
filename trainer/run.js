
const Trainer = require('./trainer');
const initialCreature = require('../creatures/dragon.json');
const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../visualizer/data');

// Function to clean the data directory
function cleanDataDirectory() {
    if (fs.existsSync(dataPath)) {
        fs.readdirSync(dataPath).forEach(file => {
            const curPath = path.join(dataPath, file);
            fs.unlinkSync(curPath); // delete each file
        });
        console.log('Cleaned visualizer/data directory.');
    }
}

cleanDataDirectory(); // Clean before starting training

const trainer = new Trainer(100, 0.3, 0.8);
trainer.start(initialCreature, 100);

console.log('Training complete!');
