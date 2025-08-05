
class Creature {
    constructor(bones, fitness, brain) {
        this.bones = bones;
        this.fitness = fitness;
        this.brain = brain;
    }

    static fromJson(json) {
        const creature = new Creature(json.bones, json.fitness || 0);
        if (json.brain) {
            const brain = new NeuralNetwork(json.brain.inputNodes, json.brain.hiddenNodes, json.brain.outputNodes);
            brain.weights_ih = json.brain.weights_ih;
            brain.weights_ho = json.brain.weights_ho;
            brain.bias_h = json.brain.bias_h;
            brain.bias_o = json.brain.bias_o;
            creature.brain = brain;
        }
        return creature;
    }

    toJson() {
        const brainData = this.brain ? {
            inputNodes: this.brain.inputNodes,
            hiddenNodes: this.brain.hiddenNodes,
            outputNodes: this.brain.outputNodes,
            weights_ih: this.brain.weights_ih,
            weights_ho: this.brain.weights_ho,
            bias_h: this.brain.bias_h,
            bias_o: this.brain.bias_o
        } : null;

        return {
            bones: this.bones,
            fitness: this.fitness,
            brain: brainData
        };
    }

    clone() {
        const clonedBones = JSON.parse(JSON.stringify(this.bones));
        const clonedBrain = this.brain ? this.brain.clone() : null;
        return new Creature(clonedBones, this.fitness, clonedBrain);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Creature;
}
