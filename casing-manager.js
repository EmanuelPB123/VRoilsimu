import { config } from './config.js';

export class CasingManager {
    updateCasings(depth) {
        config.casings.forEach(casing => {
            const casingEl = document.querySelector(`#${casing.id}`);
            if (depth >= casing.minDepth) {
                const casingHeight = Math.min(depth - casing.minDepth, casing.maxDepth - casing.minDepth);
                casingEl.setAttribute("height", Math.max(casingHeight, 0.1));
                casingEl.setAttribute("radius", casing.radius);
                casingEl.object3D.position.y = -casingHeight / 2 - casing.minDepth;
            }
        });
    }
}

