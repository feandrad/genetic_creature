
class Creature {
    constructor(bones, brain = null) {
        this.bones = bones;
        this.fitness = 0;
        this.brain = brain; // Neural network for controlling the creature
    }

    static fromJson(json) {
        // When loading from JSON, we don't have a brain yet, it will be assigned by NEAT
        return new Creature(json.bones);
    }

    toJson() {
        return {
            bones: this.bones,
            fitness: this.fitness
        };
    }

    clone() {
        const clonedBones = JSON.parse(JSON.stringify(this.bones));
        const clonedBrain = this.brain ? this.brain.clone() : null;
        return new Creature(clonedBones, clonedBrain);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Creature;
}
