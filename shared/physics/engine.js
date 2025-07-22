
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

        // Apply gravity to all points
        for (const id in positions) {
            positions[id].y += this.gravity;
        }

        // Iteratively solve constraints
        for (let i = 0; i < 15; i++) {
            this.satisfyConstraints(positions, bones);
            this.enforceGroundConstraint(positions);
        }
    }

    enforceGroundConstraint(positions) {
        for (const id in positions) {
            const pos = positions[id];
            if (pos.y > this.groundY) {
                pos.y = this.groundY; // Enforce ground as a hard constraint

                // Apply horizontal damping (friction)
                const prevPos = this._previousPositions[id];
                if (prevPos) {
                    const vx = pos.x - prevPos.x;
                    // Dampen velocity
                    pos.x = prevPos.x + vx * this.horizontalDamping;
                }
            }
        }
    }

    satisfyConstraints(positions, bones) {
        bones.forEach(bone => {
            if (!bone.parent) return;

            const parentPos = positions[bone.parent];
            const childPos = positions[bone.id];

            // 1. Satisfy length constraint
            const diff = { x: childPos.x - parentPos.x, y: childPos.y - parentPos.y };
            const distance = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
            if (distance > 0) {
                const difference = (bone.length - distance) / distance;
                const translateX = diff.x * difference * 0.5;
                const translateY = diff.y * difference * 0.5;

                childPos.x += translateX;
                childPos.y += translateY;
                parentPos.x -= translateX;
                parentPos.y -= translateY;
            }

            // 2. Enforce rigid angular constraints
            const currentDiff = { x: childPos.x - parentPos.x, y: childPos.y - parentPos.y };
            const currentAngle = this._toDegrees(Math.atan2(currentDiff.x, -currentDiff.y));

            const baseAngle = bone.initialAngle !== undefined ? bone.initialAngle : bone.angle;
            const minAngle = baseAngle - (bone.mov_angle || 0);
            const maxAngle = baseAngle + (bone.mov_angle || 0);

            let clampedAngle = currentAngle;
            let needsCorrection = false;

            // Normalize angles for correct comparison
            let normalizedCurrent = (currentAngle % 360 + 360) % 360;
            let normalizedMin = (minAngle % 360 + 360) % 360;
            let normalizedMax = (maxAngle % 360 + 360) % 360;

            if (normalizedMin > normalizedMax) { // e.g., min 350, max 10
                if (normalizedCurrent > normalizedMax && normalizedCurrent < normalizedMin) {
                    needsCorrection = true;
                    clampedAngle = Math.abs(normalizedCurrent - normalizedMin) < Math.abs(normalizedCurrent - normalizedMax) ? minAngle : maxAngle;
                }
            } else {
                if (normalizedCurrent < normalizedMin || normalizedCurrent > normalizedMax) {
                    needsCorrection = true;
                    clampedAngle = Math.max(minAngle, Math.min(maxAngle, currentAngle));
                }
            }

            if (needsCorrection) {
                const angleRad = this._toRadians(clampedAngle);
                const newX = parentPos.x + Math.sin(angleRad) * bone.length;
                const newY = parentPos.y - Math.cos(angleRad) * bone.length;
                childPos.x = newX;
                childPos.y = newY;
            }

            // 3. Apply brain-driven movement within constraints
            if (bone.current_target_deviation !== undefined) {
                let targetAngle = baseAngle + bone.current_target_deviation;
                // Clamp the target angle to the allowed range
                targetAngle = Math.max(minAngle, Math.min(maxAngle, targetAngle));

                let angleDifference = targetAngle - currentAngle;
                while (angleDifference > 180) angleDifference -= 360;
                while (angleDifference < -180) angleDifference += 360;

                const correctionStrength = 0.1 * bone.strength;
                const rotationAmount = this._toRadians(angleDifference * correctionStrength);

                const cosRot = Math.cos(rotationAmount);
                const sinRot = Math.sin(rotationAmount);

                const rotatedDiffX = currentDiff.x * cosRot - currentDiff.y * sinRot;
                const rotatedDiffY = currentDiff.x * sinRot + currentDiff.y * cosRot;

                const newDistance = Math.sqrt(rotatedDiffX * rotatedDiffX + rotatedDiffY * rotatedDiffY);
                if (newDistance > 0) {
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

if (typeof window !== 'undefined') {
    window.PhysicsEngine = PhysicsEngine;
}
