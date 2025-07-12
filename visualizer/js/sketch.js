/*  visualizer/js/sketch.js  */

let bones = [];          // array final de ossos
let positions = {};      // mapa id → p5.Vector
let currentCreature;     // The currently loaded Creature object

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
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const generation = file.split('_')[1].split('.')[0];
        generationSelect.option(`Generation ${generation}`, file);
    }
    generationSelect.changed(onGenerationChange);
    // Load the first creature by default
    if (files.length > 0) {
        loadJSON(`data/${files[0]}`, onLoaded, onError);
    }
}

function onGenerationChange() {
    const file = generationSelect.value();
    const path = `data/${file}`;
    loadJSON(path, onLoaded, onError);
}

function onLoaded(raw) {
    currentCreature = Creature.fromJson(raw);
    bones = currentCreature.bones;
    // Initialize positions for physics engine
    positions = {};
    const root = bones.find(b => b.parent === null);
    if (root) {
        positions[root.id] = createVector(0, 0);
    }
    initializeBonePositions();
    redraw();              // força desenhar quando o JSON chegou
}

function onError() {
    alert('Error: Could not load creature data.');
}

function setup() {
    createCanvas(800, 600);
    angleMode(DEGREES);
    physicsEngine = new PhysicsEngine(6, 500); // Ground at y = 500 (increased gravity)
    loop();              // só desenha quando chamarmos redraw()

    resetButton = select('#reset-button');
    resetButton.mousePressed(resetSimulation);
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
    line(0, 500, width, 500);

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
}

function drawNeuralNetwork() {
    if (!currentCreature || !currentCreature.brain) return;

    const brain = currentCreature.brain;
    const nodeSize = 10;
    const layerSpacing = 100;
    const nodeSpacing = 20;

    const startX = 50;
    const startY = 50;

    // Calculate positions for input nodes
    const inputNodesY = [];
    for (let i = 0; i < brain.inputNodes; i++) {
        inputNodesY.push(startY + i * nodeSpacing);
    }

    // Calculate positions for hidden nodes
    const hiddenNodesY = [];
    for (let i = 0; i < brain.hiddenNodes; i++) {
        hiddenNodesY.push(startY + i * nodeSpacing + (brain.inputNodes - brain.hiddenNodes) * nodeSpacing / 2);
    }

    // Calculate positions for output nodes
    const outputNodesY = [];
    for (let i = 0; i < brain.outputNodes; i++) {
        outputNodesY.push(startY + i * nodeSpacing + (brain.inputNodes - brain.outputNodes) * nodeSpacing / 2);
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

/* ---------- utilidades ---------- */

function initializeBonePositions() {
    positions = {};
    const angles = {};

    // Primeiro, encontre a raiz
    const root = bones.find(b => b.parent === null);
    if (!root) {
        console.error("No root bone found!");
        return;
    }

    // Set the root bone's initial position at the center of the canvas
    positions[root.id] = createVector(width / 2, height / 2);
    angles[root.id] = root.angle || 0;
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

        const len = bone.length || 0;
        const dx = sin(angle) * len;
        const dy = -cos(angle) * len;

        positions[id] = createVector(parentPos.x + dx, parentPos.y + dy);
        console.log(`Bone ${id} at (${positions[id].x}, ${positions[id].y}) from parent ${parentId}`);
    }

    // Ensure topological order (simple for now)
    // This loop might need to run multiple times for complex hierarchies
    for (let i = 0; i < bones.length * 2; i++) { // Iterate multiple times to ensure all bones are processed
        bones.forEach(b => {
            if (b.parent && positions[b.parent] && !positions[b.id]) {
                computePos(b.id);
            }
        });
    }

    

    console.log("Final positions:", positions);
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
