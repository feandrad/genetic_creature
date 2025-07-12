
const Creature = require('../../shared/models/creature.js');

class NEAT {
    constructor(populationSize, mutationRate, crossoverRate) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.crossoverRate = crossoverRate;
        this.population = [];
    }

    init(initialCreature) {
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(initialCreature.clone());
        }
    }

    evolve() {
        // Select the best creatures from the population
        const bestCreatures = this.selectBest();

        // Create the next generation
        const nextGeneration = [];
        for (let i = 0; i < this.populationSize; i++) {
            const parent1 = this.tournamentSelection(bestCreatures);
            const parent2 = this.tournamentSelection(bestCreatures);
            const child = this.crossover(parent1, parent2);
            this.mutate(child);
            nextGeneration.push(child);
        }

        this.population = nextGeneration;
        return this.population;
    }

    selectBest() {
        // Sort the population by fitness in descending order
        this.population.sort((a, b) => b.fitness - a.fitness);
        // Return the top half of the population
        return this.population.slice(0, this.populationSize / 2);
    }

    tournamentSelection(creatures) {
        // Select a random creature from the given list
        const randomIndex = Math.floor(Math.random() * creatures.length);
        return creatures[randomIndex];
    }

    crossover(parent1, parent2) {
        const childBones = [];
        for (let i = 0; i < parent1.bones.length; i++) {
            const bone1 = parent1.bones[i];
            const bone2 = parent2.bones[i];
            childBones.push(Math.random() < 0.5 ? bone1 : bone2);
        }
        return new Creature(childBones);
    }

    mutate(creature) {
        if (Math.random() < this.mutationRate) {
            const randomIndex = Math.floor(Math.random() * creature.bones.length);
            const randomBone = creature.bones[randomIndex];
            randomBone.angle += (Math.random() - 0.5) * 10;
        }
    }
}

module.exports = NEAT;
