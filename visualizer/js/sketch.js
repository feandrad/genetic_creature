/*  visualizer/js/sketch.js  */

let bones = [];          // array final de ossos
let positions = {};      // mapa id → p5.Vector
let currentCreature;     // The currently loaded Creature object

const GROUND_OFFSET = 15;

let generationSelect;
let resetButton;
let physicsEngine;

const dataPath = 'data/';

function preload() {
    loadJSON('data/creatures.json', onCreatureListLoaded, onError);
}

function onCreatureListLoaded(creatureFiles) {
    populateGenerationSelect(creatureFiles);
}

function populateGenerationSelect(files) {
    generationSelect = select('#generation-select');

    // Sort files numerically based on the generation number in the filename
    files.sort((a, b) => {
        const genA = parseInt(a.split('_')[1].split('.')[0], 10);
        const genB = parseInt(b.split('_')[1].split('.')[0], 10);
        return genA - genB;
    });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const generation = file.split('_')[1].split('.')[0];
        generationSelect.option(`Generation ${generation}`, file);
    }
    generationSelect.changed(onGenerationChange);
}

function onGenerationChange() {
    const file = generationSelect.value();
    const path = `data/${file}`;
    loadJSON(path, onLoaded, onError);
}

function onLoaded(raw) {
    currentCreature = Creature.fromJson(raw);
    bones = currentCreature.bones;
    initializeBonePositions();
    redraw();
}

function onError() {
    alert('Error: Could not load creature data.');
}

function setup() {
    createCanvas(windowWidth, windowHeight - 120); // Subtract 80px for header/dropdown
    angleMode(DEGREES);
    physicsEngine = new PhysicsEngine(6, height - GROUND_OFFSET); // Ground at height - GROUND_OFFSET
    loop();              // só desenha quando chamarmos redraw()

    resetButton = select('#reset-button');
    resetButton.mousePressed(resetSimulation);

    if (generationSelect && generationSelect.elt.options.length > 0) {
        onGenerationChange();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight - 120);
    physicsEngine.groundY = height - GROUND_OFFSET; // Update ground position on resize
}

function resetSimulation() {
    fetch('/reset-simulation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.text())
        .then(data => {
            alert(data);
            // Reload the page to reflect the new data
            location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error resetting simulation');
        });
}

function draw() {
    background(250);

    // Draw ground
    stroke(0);
    strokeWeight(2);
    line(0, height - GROUND_OFFSET, width, height - GROUND_OFFSET);

    if (!bones.length) {
        textAlign(CENTER, CENTER);
        text('Nenhum esqueleto carregado', width / 2, height / 2);
        return;
    }

    physicsEngine.update(positions, bones);
    console.log("Bones in draw:", bones);
    console.log("Positions in draw:", positions);
    drawBones();
    drawJoints();
    drawCenterOfGravity();
    drawNeuralNetwork();
    updateCreatureMovement();
}

function updateCreatureMovement() {
    if (!currentCreature || !currentCreature.brain) return;

    const brain = currentCreature.brain;
    const inputs = [];

    // Input 1: Root bone Y position (normalized)
    const root = bones.find(b => b.parent === null);
    if (root && positions[root.id]) {
        inputs.push(map(positions[root.id].y, 0, height, -1, 1));
    } else {
        inputs.push(0);
    }

    // Input 2: Center of Gravity X position (normalized)
    const cog = calculateCenterOfGravity();
    inputs.push(map(cog.x, 0, width, -1, 1));

    // Input 3: Center of Gravity Y position (normalized)
    inputs.push(map(cog.y, 0, height, -1, 1));

    // Input 4-N: Bone angles (normalized)
    bones.forEach(bone => {
        // For now, we'll just use the initial angle as a placeholder input
        // In a real simulation, you'd calculate current angle from positions
        inputs.push(map(bone.angle || 0, -180, 180, -1, 1));
    });

    // Ensure inputs match the brain's expected input nodes
    while (inputs.length < brain.inputNodes) {
        inputs.push(0); // Pad with zeros if not enough inputs
    }
    if (inputs.length > brain.inputNodes) {
        inputs.splice(brain.inputNodes); // Trim if too many inputs
    }

    const outputs = brain.feedForward(inputs);

    // Apply outputs to bone current_target_deviation
    for (let i = 0; i < bones.length; i++) {
        if (i < outputs.length) {
            // Map output (0-1) to a normalized range (-1 to 1)
            const normalizedOutput = map(outputs[i], 0, 1, -1, 1);
            // Calculate the desired deviation based on the bone's mov_angle property
            bones[i].current_target_deviation = normalizedOutput * (bones[i].mov_angle || 0);
        }
    }
}

function drawNeuralNetwork() {
    if (!currentCreature || !currentCreature.brain) return;

    const brain = currentCreature.brain;
    const nodeSize = 10;
    const layerSpacing = 80; // Horizontal spacing between layers
    const nodeSpacing = 15;  // Vertical spacing between nodes within a layer

    const margin = 30; // Increased margin from the top and right edges

    // Calculate startX for top-right alignment
    const brainWidth = 2 * layerSpacing + 3 * nodeSize; // Total width of the brain visualization
    const startX = width - brainWidth - margin;

    // Calculate the maximum number of nodes in any layer to determine overall vertical space needed
    const maxNodesInAnyLayer = Math.max(brain.inputNodes, brain.hiddenNodes, brain.outputNodes);

    // Calculate the starting Y position for each layer to ensure vertical centering
    // Each layer will be centered within the space defined by maxNodesInAnyLayer
    const inputLayerStartY = margin + (maxNodesInAnyLayer - brain.inputNodes) * nodeSpacing / 2;
    const hiddenLayerStartY = margin + (maxNodesInAnyLayer - brain.hiddenNodes) * nodeSpacing / 2;
    const outputLayerStartY = margin + (maxNodesInAnyLayer - brain.outputNodes) * nodeSpacing / 2;


    // Calculate positions for input nodes
    const inputNodesY = [];
    for (let i = 0; i < brain.inputNodes; i++) {
        inputNodesY.push(inputLayerStartY + i * nodeSpacing);
    }

    // Calculate positions for hidden nodes
    const hiddenNodesY = [];
    for (let i = 0; i < brain.hiddenNodes; i++) {
        hiddenNodesY.push(hiddenLayerStartY + i * nodeSpacing);
    }

    // Calculate positions for output nodes
    const outputNodesY = [];
    for (let i = 0; i < brain.outputNodes; i++) {
        outputNodesY.push(outputLayerStartY + i * nodeSpacing);
    }

    // Draw connections (weights)
    stroke(150);
    strokeWeight(0.5);
    for (let i = 0; i < brain.weights_ih.length; i++) { // hidden to input
        for (let j = 0; j < brain.weights_ih[i].length; j++) {
            const weight = brain.weights_ih[i][j];
            const alpha = map(abs(weight), 0, 1, 50, 255); // Map absolute weight to alpha
            if (weight > 0) {
                stroke(0, 255, 0, alpha); // Green for positive
            } else {
                stroke(255, 0, 0, alpha); // Red for negative
            }
            line(startX, inputNodesY[j], startX + layerSpacing, hiddenNodesY[i]);
        }
    }

    for (let i = 0; i < brain.weights_ho.length; i++) { // output to hidden
        for (let j = 0; j < brain.weights_ho[i].length; j++) {
            const weight = brain.weights_ho[i][j];
            const alpha = map(abs(weight), 0, 1, 50, 255);
            if (weight > 0) {
                stroke(0, 255, 0, alpha);
            } else {
                stroke(255, 0, 0, alpha);
            }
            line(startX + layerSpacing, hiddenNodesY[j], startX + 2 * layerSpacing, outputNodesY[i]);
        }
    }

    // Draw nodes
    noStroke();
    fill(100);
    for (let i = 0; i < brain.inputNodes; i++) {
        circle(startX, inputNodesY[i], nodeSize);
    }
    for (let i = 0; i < brain.hiddenNodes; i++) {
        circle(startX + layerSpacing, hiddenNodesY[i], nodeSize);
    }
    for (let i = 0; i < brain.outputNodes; i++) {
        circle(startX + 2 * layerSpacing, outputNodesY[i], nodeSize);
    }
}

function calculateCenterOfGravity() {
    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;

    bones.forEach(bone => {
        const pos = positions[bone.id];
        const weight = bone.weight || 1.0; // Default weight if not specified

        if (pos) {
            totalX += pos.x * weight;
            totalY += pos.y * weight;
            totalWeight += weight;
        }
    });

    if (totalWeight === 0) {
        return createVector(0, 0); // Return origin if no weighted bones
    }

    return createVector(totalX / totalWeight, totalY / totalWeight);
}

function drawCenterOfGravity() {
    const cog = calculateCenterOfGravity();
    fill(0, 0, 255); // Blue color
    noStroke();
    circle(cog.x, cog.y, 15); // Draw a blue circle for CoG
}

function initializeBonePositions() {
    positions = {};
    const angles = {};

    const root = bones.find(b => b.parent === null);
    if (!root) {
        console.error("No root bone found!");
        return;
    }

    // Set the root bone's initial position at the center of the canvas
    positions[root.id] = createVector(width / 2, height / 2);
    angles[root.id] = root.angle || 0;
    root.initialAngle = root.angle || 0; // Set initial global angle for the root
    console.log(`Root bone ${root.id} at (${positions[root.id].x}, ${positions[root.id].y})`);

    // Now calculate the children in order
    const boneMap = Object.fromEntries(bones.map(b => [b.id, b]));

    // Function to compute position recursively
    function computePos(id) {
        const bone = boneMap[id];
        const parentId = bone.parent;
        const parentPos = positions[parentId];
        const parentAngle = angles[parentId] || 0;

        const angle = (bone.angle || 0) + parentAngle;
        angles[id] = angle;
        bone.initialAngle = angle; // Store the calculated global angle

        const len = bone.length || 0;
        const dx = sin(angle) * len;
        const dy = -cos(angle) * len;

        positions[id] = createVector(parentPos.x + dx, parentPos.y + dy);
        console.log(`Bone ${id} at (${positions[id].x}, ${positions[id].y}) from parent ${parentId}`);
    }

    for (let i = 0; i < bones.length * 2; i++) {
        bones.forEach(b => {
            if (b.parent && positions[b.parent] && !positions[b.id]) {
                computePos(b.id);
            }
        });
    }
}

function drawBones() {
    stroke(40);
    strokeWeight(4);
    bones.forEach(b => {
        if (!b.parent) return;
        const a = positions[b.parent];
        const c = positions[b.id];
        line(a.x, a.y, c.x, c.y);
    });
}

function drawJoints() {
    const root = bones.find(b => b.parent === null);

    for (const id in positions) {
        const p = positions[id];

        if (id === root.id) {
            fill(200, 50, 50);     // vermelho para root
        } else {
            fill(240, 200, 50);    // amarelo para os demais
        }

        stroke(20);
        strokeWeight(1.5);
        circle(p.x, p.y, 10);
    }
}
