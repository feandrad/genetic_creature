
const PhysicsEngine = require('../../shared/physics/engine.js');

class Simulator {
    constructor(simulationSteps) {
        this.simulationSteps = simulationSteps;
        this.physicsEngine = new PhysicsEngine(0.1, 500);
    }

    simulate(creature) {
        // Initialize positions based on bones
        const positions = {};
        const root = creature.bones.find(b => !b.parent);
        positions[root.id] = { x: 300, y: 300 };
        this.calculateInitialPositions(root, positions, creature.bones);

        for (let i = 0; i < this.simulationSteps; i++) {
            // Prepare inputs for the neural network
            const inputs = this.prepareInputs(positions, creature.bones);

            // Get the neural network's output
            const outputs = creature.brain.feedForward(inputs);

            // Apply the neural network's output to the bones
            for (let j = 0; j < outputs.length; j++) {
                creature.bones[j].current_target_deviation = outputs[j] * 45; // Scale output to a reasonable angle
            }

            // Update physics
            this.physicsEngine.update(positions, creature.bones);
        }

        // Calculate fitness
        const finalX = positions[root.id].x;
        creature.fitness = Math.max(0, finalX - 300);
    }

    prepareInputs(positions, bones) {
        const root = bones.find(b => !b.parent);
        const rootPos = positions[root.id];

        // Calculate center of gravity
        let totalMass = 0;
        let cogX = 0;
        let cogY = 0;
        for (const bone of bones) {
            const pos = positions[bone.id];
            const mass = bone.weight || 1.0;
            cogX += pos.x * mass;
            cogY += pos.y * mass;
            totalMass += mass;
        }
        cogX /= totalMass;
        cogY /= totalMass;

        const inputs = [
            cogX,
            cogY,
            rootPos.y > this.physicsEngine.groundY - 5 ? 1 : 0, // Ground contact
        ];

        // Add bone angles to the inputs
        for (const bone of bones) {
            inputs.push(bone.angle);
        }

        return inputs;
    }

    calculateInitialPositions(bone, positions, bones, parentAngle = 0) {
        // Calculate the global angle for the current bone
        const globalAngle = (bone.angle || 0) + parentAngle;
        bone.initialAngle = globalAngle; // Store the global angle

        const parentPos = positions[bone.id];
        const children = bones.filter(b => b.parent === bone.id);

        children.forEach(child => {
            const angleRad = this.physicsEngine._toRadians(globalAngle + (child.angle || 0));
            const x = parentPos.x + Math.sin(angleRad) * child.length;
            const y = parentPos.y + Math.cos(angleRad) * child.length;
            positions[child.id] = { x, y };
            // Recursively call for children, passing the current bone's global angle
            this.calculateInitialPositions(child, positions, bones, globalAngle);
        });
    }
}

module.exports = Simulator;
