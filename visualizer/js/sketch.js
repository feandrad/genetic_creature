/*  visualizer/js/sketch.js  */

let bones = [];          // array final de ossos
let positions = {};      // mapa id → p5.Vector

let generationSelect;
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
    bones = Array.isArray(raw) ? raw : raw.bones || [];
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
    alert('Erro: não encontrei ' + path);
}

function setup() {
    createCanvas(800, 600);
    angleMode(DEGREES);
    physicsEngine = new PhysicsEngine(6, 500); // Ground at y = 500 (increased gravity)
    loop();              // só desenha quando chamarmos redraw()
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
