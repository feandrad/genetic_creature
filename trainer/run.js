
const Trainer = require('./trainer');
const initialCreature = require('../creatures/dragon.json');

const trainer = new Trainer(100, 0.3, 0.8);
trainer.start(initialCreature, 100);

console.log('Training complete!');
