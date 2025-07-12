
class Creature {
    constructor(bones) {
        this.bones = bones;
        this.fitness = 0;
    }

    static fromJson(json) {
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
        return new Creature(clonedBones);
    }
}

module.exports = Creature;
