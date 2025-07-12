
class PhysicsEngine {
    constructor(gravity, groundY) {
        this.gravity = gravity;
        this.groundY = groundY;
    }

    update(positions, bones) {
        for (const id in positions) {
            const pos = positions[id];
            pos.y += this.gravity;

            if (pos.y > this.groundY) {
                pos.y = this.groundY;
            }
        }

        for (let i = 0; i < 3; i++) {
            this.satisfyConstraints(positions, bones);
        }
    }

    satisfyConstraints(positions, bones) {
        bones.forEach(bone => {
            if (!bone.parent) return;

            const parentPos = positions[bone.parent];
            const childPos = positions[bone.id];

            const diff = { x: childPos.x - parentPos.x, y: childPos.y - parentPos.y };
            const distance = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
            const difference = (bone.length - distance) / distance;

            const translateX = diff.x * difference * 0.5;
            const translateY = diff.y * difference * 0.5;

            childPos.x += translateX;
            childPos.y += translateY;
            parentPos.x -= translateX;
            parentPos.y -= translateY;
        });
    }
}
