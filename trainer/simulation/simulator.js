
const PhysicsEngine = require('../../shared/physics/engine.js');

class Simulator {
    constructor(simulationSteps) {
        this.simulationSteps = simulationSteps;
        this.physicsEngine = new PhysicsEngine(6, 500);
    }

    simulate(creature) {
        const positions = {};
        const root = creature.bones.find(b => !b.parent);
        positions[root.id] = { x: 300, y: 300 };
        this.calculateInitialPositions(root, positions, creature.bones);

        let lastStableStep = this.simulationSteps - 1; // fallback

        for (let i = 0; i < this.simulationSteps; i++) {
            const inputs = this.prepareInputs(positions, creature.bones);
            const outputs = creature.brain.feedForward(inputs);

            for (let j = 0; j < outputs.length; j++) {
                creature.bones[j].current_target_deviation = outputs[j] * 45;
            }

            this.physicsEngine.update(positions, creature.bones);

            // verifica estabilidade
            if (this._isStable(creature.bones)) {
                lastStableStep = i; // guarda o último instante estável
            }
        }

        // Recalcula altura no último instante estável
        const fitness = this._calculateFitnessAtStep(root, creature.bones, positions);
        creature.fitness = fitness;
    }

    _isStable(bones) {
        // Exemplo: considera estável se todas as juntas mudaram < 0.5° desde o último frame
        return bones.every(bone => Math.abs(bone.mov_angle) < 0.5);
    }

    _calculateFitnessAtStep(root, bones, positions) {
        let totalMass = 0;
        let cogY = 0;
        for (const bone of bones) {
            const pos = positions[bone.id];
            const mass = bone.weight || 1.0;
            cogY += pos.y * mass;
            totalMass += mass;
        }
        if (totalMass > 0) cogY /= totalMass;

        let cogFitness = Math.max(0, this.physicsEngine.groundY - cogY);
        let rootFitness = Math.max(0, this.physicsEngine.groundY - positions[root.id].y);

        return cogFitness * 0.7 + rootFitness * 0.3;
    }

    _calculateFitness(root, bones, positions) {
        // Calculate final center of gravity (CoG)
        let totalMass = 0;
        let cogY = 0;
        for (const bone of bones) {
            const pos = positions[bone.id];
            const mass = bone.weight || 1.0;

            if (pos === undefined) {
                console.warn(`[Simulator] WARNING: Position for bone ID ${bone.id} is undefined. This bone will not contribute to CoG calculation.`);
                continue; // Skip this bone if its position is undefined
            }

            if (isNaN(pos.y)) {
                console.warn(`[Simulator] WARNING: pos.y for bone ID ${bone.id} is NaN. Skipping this bone for CoG calculation.`);
                continue; // Skip this bone if pos.y is NaN
            }

            cogY += pos.y * mass;
            totalMass += mass;
        }

        if (totalMass > 0) {
            cogY /= totalMass;
        } else {
            console.warn(`[Simulator] WARNING: totalMass is 0. Falling back to groundY for cogY.`);
            // Fallback to root position if totalMass is 0
            cogY = this.physicsEngine.groundY;
        }

        if (isNaN(cogY)) {
            console.error(`[Simulator] ERROR: cogY is NaN after calculation. totalMass: ${totalMass}, bones processed: ${bones.length}`);
            // Handle this case, perhaps return a very low fitness or throw an error
            return 0; 
        }

        // Fitness is based solely on the final height of the CoG from the ground.
        // A smaller Y value means higher, as Y increases downwards. groundY is 500.
        let cogFitness = Math.max(0, this.physicsEngine.groundY - cogY);
        let rootFitness = Math.max(0, this.physicsEngine.groundY - positions[root.id].y);

        // console.log("Fitness found: ", cogFitness, rootFitness);
        return cogFitness * 0.7 + rootFitness * 0.3;
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

    calculateInitialPositions(root, positions, bones) {
        const angles = {};
        const boneMap = Object.fromEntries(bones.map(b => [b.id, b]));

        // Set the root bone's initial angle
        angles[root.id] = root.angle || 0;
        root.initialAngle = root.angle || 0;

        // Function to compute position recursively, adapted from visualizer
        function computePos(id) {
            const bone = boneMap[id];
            const parentId = bone.parent;
            const parentPos = positions[parentId];
            const parentAngle = angles[parentId] || 0;

            const angle = (bone.angle || 0) + parentAngle;
            angles[id] = angle;
            bone.initialAngle = angle; // Store the calculated global angle

            const len = bone.length || 0;
            const angleRad = this.physicsEngine._toRadians(angle);
            const dx = Math.sin(angleRad) * len;
            const dy = Math.cos(angleRad) * len; // Corrected: Use positive cos for dy as Y points down

            positions[id] = { x: parentPos.x + dx, y: parentPos.y + dy };
        }

        // Iteratively calculate positions to handle dependencies
        for (let i = 0; i < bones.length * 2; i++) {
            bones.forEach(b => {
                if (b.parent && positions[b.parent] && !positions[b.id]) {
                    computePos.call(this, b.id);
                }
            });
        }
    }
}

module.exports = Simulator;
