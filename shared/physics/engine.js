
class PhysicsEngine {
    constructor(gravity, groundY, horizontalDamping = 0.5) {
        this.horizontalDamping = horizontalDamping;
        this.gravity = gravity;
        this.groundY = groundY;
        this._previousPositions = {};
    }

    update(positions, bones) {
        // Store current positions as previous positions for the next frame
        for (const id in positions) {
            this._previousPositions[id] = { x: positions[id].x, y: positions[id].y };
        }

        for (const id in positions) {
            const pos = positions[id];
            // Apply gravity
            pos.y += this.gravity;

            // Ground collision detection and resolution (without joint radius)
            if (pos.y > this.groundY) {
                // Apply upward force based on bone strength
                const bone = bones.find(b => positions[b.id] === pos); // Find the bone associated with this position
                if (bone) {
                    pos.y -= bone.strength * 0.2; // Apply upward force
                }
                pos.y = Math.min(pos.y, this.groundY); // Clamp position at ground level, but allow it to be pushed up

                // Apply horizontal damping (friction)
                const prevPos = this._previousPositions[id];
                if (prevPos) {
                    let dx = pos.x - prevPos.x;
                    // Apply static friction: if horizontal movement is very small, stop it completely
                    if (Math.abs(dx) < this.horizontalDamping) {
                        dx = 0;
                    }
                    pos.x = prevPos.x + dx;
                }
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

            // Apply angular constraint based on current_target_deviation
            if (bone.current_target_deviation !== undefined) {
                const currentDiffX = childPos.x - parentPos.x;
                const currentDiffY = childPos.y - parentPos.y;
                const currentDistance = Math.sqrt(currentDiffX * currentDiffX + currentDiffY * currentDiffY);

                if (currentDistance > 0) {
                    // Calculate current angle of the bone
                    const currentAngle = this._toDegrees(Math.atan2(currentDiffX, -currentDiffY));
                    
                    // Calculate the target angle based on the bone's original angle and the neural network's output
                    let targetAngle = (bone.angle || 0) + bone.current_target_deviation;

                    // Clamp targetAngle within mov_angle limits
                    const minAngle = (bone.angle || 0) - (bone.mov_angle || 0);
                    const maxAngle = (bone.angle || 0) + (bone.mov_angle || 0);
                    targetAngle = Math.max(minAngle, Math.min(maxAngle, targetAngle));

                    let angleDifference = targetAngle - currentAngle;

                    // Normalize angleDifference to be between -180 and 180
                    while (angleDifference > 180) angleDifference -= 360;
                    while (angleDifference < -180) angleDifference += 360;

                    const angularCorrectionStrength = 0.05; // How strongly to correct the angle
                    const rotationAmount = this._toRadians(angleDifference * angularCorrectionStrength);

                    // Rotate the child position around the parent position
                    const cosRot = Math.cos(rotationAmount);
                    const sinRot = Math.sin(rotationAmount);

                    const rotatedDiffX = currentDiffX * cosRot - currentDiffY * sinRot;
                    const rotatedDiffY = currentDiffX * sinRot + currentDiffY * cosRot;

                    // Re-normalize to bone.length after rotation to maintain length
                    const newDistance = Math.sqrt(rotatedDiffX * rotatedDiffX + rotatedDiffY * rotatedDiffY);
                    const scaleFactor = bone.length / newDistance;

                    childPos.x = parentPos.x + rotatedDiffX * scaleFactor;
                    childPos.y = parentPos.y + rotatedDiffY * scaleFactor;
                }
            }
        });
    }

    _toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    _toDegrees(radians) {
        return radians * 180 / Math.PI;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
