
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
            console.log(`[Trainer] Evaluating generation ${i}/${generations}...`);
            let best = this.neat.evaluateFitness();
            this.saveCreature(best, i);
            this.neat.breedNewGeneration();
        }
        this.saveCreatureList(generations);
    }

    saveCreature(bestCreature, generation) {
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
