
const Creature = require('../shared/models/creature.js');
const NEAT = require('./genetic/neat.js');

const path = require('path');

class Trainer {
    constructor(populationSize, mutationRate, crossoverRate) {
        this.neat = new NEAT(populationSize, mutationRate, crossoverRate);
    }

    start(initialCreatureJson, generations) {
        const initialCreature = Creature.fromJson(initialCreatureJson);
        this.neat.init(initialCreature);

        for (let i = 0; i < generations; i++) {
            console.log(`[Trainer] Evolving generation ${i + 1}/${generations}...`);
            this.neat.evolve();
            this.saveBestCreature(i);
        }
        this.saveCreatureList(generations);
    }

    saveBestCreature(generation) {
        const bestCreature = this.neat.population[0];
        const creatureJson = bestCreature.toJson();
        const fs = require('fs');
        const filePath = path.resolve(__dirname, `../visualizer/data/creature_${generation}.json`);
        fs.writeFileSync(filePath, JSON.stringify(creatureJson, null, 2));
    }

    saveCreatureList(generations) {
        const creatureFiles = [];
        for (let i = 0; i < generations; i++) {
            creatureFiles.push(`creature_${i}.json`);
        }
        const fs = require('fs');
        const filePath = path.resolve(__dirname, '../visualizer/data/creatures.json');
        fs.writeFileSync(filePath, JSON.stringify(creatureFiles, null, 2));
    }
}

module.exports = Trainer;

// Example usage:
// const trainer = new Trainer(100, 0.01, 0.8);
// const initialCreature = require('../../creatures/dragon.json');
// trainer.start(initialCreature);
