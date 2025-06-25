/*  visualizer/js/sketch.js  */

let bones = [];          // array final de ossos
let positions = {};      // mapa id → p5.Vector

const path = '../creatures/dragon.json';

function preload() {
    // caminho a partir de  .../visualizer/index.html
    loadJSON(path, onLoaded, onError);
}

function onLoaded(raw) {
    bones = Array.isArray(raw) ? raw : raw.bones || [];
    redraw();              // força desenhar quando o JSON chegou
}

function onError() {
    alert('Erro: não encontrei ' + path);
}

function setup() {
    createCanvas(800, 600);
    angleMode(DEGREES);
    noLoop();              // só desenha quando chamarmos redraw()
}

function draw() {
    background(250);
    translate(width / 2, height / 2);

    if (!bones.length) {
        textAlign(CENTER, CENTER);
        text('Nenhum esqueleto carregado', 0, 0);
        return;
    }

    calcPositions();
    drawBones();
    drawJoints();
}

/* ---------- utilidades ---------- */

function calcPositions() {
    positions = {};
    const angles = {};

    // Primeiro, encontre a raiz
    const root = bones.find(b => b.parent === null);
    if (!root) return;

    positions[root.id] = createVector(0, 0);
    angles[root.id] = root.angle || 0;

    // Agora calcule os filhos em ordem
    const boneMap = Object.fromEntries(bones.map(b => [b.id, b]));

    // Função recursiva para calcular a posição
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
    }

    // Garantir ordem topológica simples (sem usar sort por enquanto)
    bones.forEach(b => {
        if (b.parent && positions[b.parent]) {
            computePos(b.id);
        }
    });
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
