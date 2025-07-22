
const Creature = require('../../shared/models/creature.js');
const NeuralNetwork = require('../../shared/models/neural_network.js');
const Simulator = require('../simulation/simulator.js');

class NEAT {
    constructor(populationSize, mutationRate, crossoverRate) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.crossoverRate = crossoverRate;
        this.population = [];
        this.simulator = new Simulator(1000);
        this.inputNodes = 5; // Placeholder: CoG x, CoG y, root angle, root angular velocity, ground contact
        this.hiddenNodes = 10;
        this.outputNodes = 0; // Will be set based on creature bones
    }

    init(initialCreature) {
        this.inputNodes = 3 + initialCreature.bones.length; // 3 for root/CoG + bones.length for angles
        this.outputNodes = initialCreature.bones.length; // One output for each bone's mov_angle
        for (let i = 0; i < this.populationSize; i++) {
            const brain = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);
            const newCreature = initialCreature.clone();
            newCreature.brain = brain;
            this.population.push(newCreature);
        }
    }

    evolve() {
        // Evaluate the fitness of each creature
        this.population.forEach(creature => {
            this.simulator.simulate(creature);
        });

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
        return new Creature(childBones, Math.random() < 0.5 ? parent1.brain.clone() : parent2.brain.clone());
    }

    mutate(creature) {
        if (Math.random() < this.mutationRate) {
            const randomIndex = Math.floor(Math.random() * creature.bones.length);
            const randomBone = creature.bones[randomIndex];
            randomBone.angle += (Math.random() - 0.5) * 10;
        }
        if (creature.brain) {
            creature.brain.mutate(this.mutationRate);
        }
    }
}

module.exports = NEAT;
