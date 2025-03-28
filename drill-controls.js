import { config } from './config.js';
import { BitManager } from './bit-manager.js';
import { CasingManager } from './casing-manager.js';

let timeMultiplier = 1;
let maxDepthReached = 0;
let isDrillRaised = false;

const bitManager = new BitManager();
const casingManager = new CasingManager();

// Add new class for drilling parameters calculation
class DrillingParameters {
    constructor() {
        this.bitWear = 0;
        this.mudDensity = config.drillingParams.mudDensityBase;
        this.rotationSpeed = config.drillingParams.rotationSpeedBase;
        this.mudFlow = config.drillingParams.mudFlowBase;
        this.weightOnBit = config.drillingParams.weightOnBitBase;
    }

    calculateParameters(depth, currentLayer) {
        // Calculate pressure (convert meters to feet first)
        const depthInFeet = depth * 3.28084;
        const pressure = depthInFeet * 0.052 * this.mudDensity;
        
        // Calculate temperature
        const temperature = config.drillingParams.initialTemp + (depth / 1000) * config.drillingParams.tempGradient;
        
        // Calculate bit wear based on formula
        const wearIncrement = (currentLayer.hardness * this.rotationSpeed * this.weightOnBit) / 100000;
        const previousWear = this.bitWear;
        this.bitWear = Math.min(100, this.bitWear + wearIncrement);
        
        // Check if bit wear just reached 100%
        if (previousWear < 100 && this.bitWear >= 100) {
            alert("¡Advertencia! Desgaste de broca al 100%. La perforación se detendrá.");
            // Find and stop the drilling
            const drill = document.querySelector('#broca');
            if (drill && drill.components.perforacion) {
                drill.components.perforacion.data.activo = false;
            }
        }
        
        // Find closest resource
        const nearestResource = this.findNearestResource(depth);
        
        // Calculate drilling speed
        const drillSpeed = config.drillSpeed * 
            (1/currentLayer.hardness) * 
            (this.rotationSpeed/100) * 
            (1 - this.bitWear/200) * 
            (this.mudFlow/250) * 
            (this.weightOnBit/25);
        
        return {
            pressure: Math.round(pressure),
            temperature: Math.round(temperature * 10) / 10,
            mudDensity: this.mudDensity,
            rotationSpeed: this.rotationSpeed,
            bitWear: Math.round(this.bitWear),
            resourceDistance: nearestResource.distance,
            resourceType: nearestResource.type,
            mudFlow: this.mudFlow,
            weightOnBit: this.weightOnBit,
            drillSpeed: drillSpeed
        };
    }

    findNearestResource(depth) {
        const resources = config.drillingParams.resources;
        let nearest = { distance: Infinity, type: 'none', percentage: 0 };
        let highestPercentage = 0;
        
        resources.forEach(resource => {
            // First find the resource with highest percentage
            if (resource.percentage > highestPercentage) {
                highestPercentage = resource.percentage;
                
                // Now calculate distance to this dominant resource
                if (depth >= resource.minDepth && depth <= resource.maxDepth) {
                    nearest = {
                        distance: 0,
                        type: resource.type,
                        percentage: resource.percentage
                    };
                } else {
                    const distanceToMin = Math.abs(depth - resource.minDepth);
                    const distanceToMax = Math.abs(depth - resource.maxDepth);
                    const distance = Math.min(distanceToMin, distanceToMax);
                    nearest = {
                        distance: distance,
                        type: resource.type,
                        percentage: resource.percentage
                    };
                }
            }
        });
        
        return nearest;
    }

    updateResourcePercentage(type, value) {
        const resources = config.drillingParams.resources;
        const resource = resources.find(r => r.type === type);
        if (!resource) return;

        const oldValue = resource.percentage;
        const diff = value - oldValue;
        
        // Adjust other percentages proportionally
        const otherResources = resources.filter(r => r.type !== type);
        const totalOtherPercentage = otherResources.reduce((sum, r) => sum + r.percentage, 0);
        
        // Prevent division by zero and ensure proper distribution
        if (totalOtherPercentage > 0) {
            otherResources.forEach(r => {
                const adjustmentRatio = r.percentage / totalOtherPercentage;
                r.percentage = Math.max(0, Math.min(100, r.percentage - (diff * adjustmentRatio)));
            });
        } else {
            // If other percentages sum to 0, distribute remaining evenly
            const remainingPercentage = 100 - value;
            const evenShare = remainingPercentage / otherResources.length;
            otherResources.forEach(r => {
                r.percentage = evenShare;
            });
        }
        
        resource.percentage = Math.max(0, Math.min(100, value));
        
        // Normalize to ensure exactly 100%
        const total = resources.reduce((sum, r) => sum + r.percentage, 0);
        if (total !== 100 && total > 0) {
            const scaleFactor = 100 / total;
            resources.forEach(r => {
                r.percentage = Math.round(r.percentage * scaleFactor * 10) / 10;
            });
        }

        // Final check to ensure we have exactly 100%
        const finalTotal = resources.reduce((sum, r) => sum + r.percentage, 0);
        if (Math.abs(finalTotal - 100) > 0.1) {
            const mainResource = resources.find(r => r.type === type);
            mainResource.percentage += (100 - finalTotal);
        }
    }

    reset() {
        this.bitWear = 0;
    }

    setParameter(param, value) {
        switch(param) {
            case 'mudDensity':
                this.mudDensity = parseFloat(value);
                break;
            case 'rotationSpeed':
                this.rotationSpeed = parseInt(value);
                break;
            case 'mudFlow':
                this.mudFlow = parseInt(value);
                break;
            case 'weightOnBit':
                this.weightOnBit = parseInt(value);
                break;
        }
    }
}

// Update AFRAME component
AFRAME.registerComponent('perforacion', {
    schema: {
        profundidad: { type: 'number', default: 0 },
        activo: { type: 'boolean', default: false }
    },

    init: function() {
        this.drillingParams = new DrillingParameters();
    },
    
    tick: function () {
        if (this.data.activo) {
            const currentLayer = this.getCurrentLayer();
            const params = this.drillingParams.calculateParameters(this.data.profundidad, currentLayer);
            
            // Use the calculated drill speed
            this.data.profundidad += params.drillSpeed * timeMultiplier;
            
            if (this.data.profundidad > maxDepthReached) {
                maxDepthReached = this.data.profundidad;
            }
            this.el.object3D.position.y = -this.data.profundidad;
            
            this.updateDrillingInfo(params);
            casingManager.updateCasings(this.data.profundidad);

            // Update extraction pipe
            const extractionPipe = document.querySelector('#extraction-pipe');
            if (this.data.profundidad > 0) {
                extractionPipe.setAttribute("height", this.data.profundidad);
                extractionPipe.setAttribute("position", `0 ${-this.data.profundidad/2} -3`);
            }
        }
    },

    getCurrentLayer() {
        const depth = this.data.profundidad;
        return config.layers.find(layer => depth >= layer.startDepth && depth < layer.endDepth) || 
               config.layers[config.layers.length - 1];
    },

    updateDrillingInfo: function(params) {
        document.getElementById('profundidad').textContent = `${this.data.profundidad.toFixed(2)} m`;
        document.getElementById('pressure').textContent = `${params.pressure} PSI`;
        document.getElementById('temperature').textContent = `${params.temperature} °C`;
        document.getElementById('mud-density').textContent = `${params.mudDensity} g/cm³`;
        document.getElementById('rotation-speed').textContent = `${params.rotationSpeed} RPM`;
        document.getElementById('bit-wear').textContent = `${params.bitWear} %`;
        document.getElementById('resource-distance').textContent = 
            params.resourceType !== 'none' ? `${params.resourceDistance.toFixed(2)} m to ${params.resourceType}` : 'N/A';
        document.getElementById('mud-flow').textContent = `${params.mudFlow} L/min`;
        document.getElementById('weight-on-bit').textContent = `${params.weightOnBit} kN`;
    }
});

class DrillControls {
    constructor() {
        this.initialCameraY = 1.6;
        this.initializeCamera();
    }

    initializeCamera() {
        const scene = document.querySelector('a-scene');
        if (!scene) {
            setTimeout(() => this.initializeCamera(), 100);
            return;
        }

        if (scene.hasLoaded) {
            this.setupCamera();
        } else {
            scene.addEventListener('loaded', () => {
                setTimeout(() => this.setupCamera(), 100);
            });
        }
    }

    setupCamera() {
        const camera = document.querySelector('[camera]').parentElement;
        if (!camera) {
            console.warn('Camera not found, retrying...');
            setTimeout(() => this.setupCamera(), 100);
            return;
        }
        this.camera = camera;
    }

    startDrilling() {
        const drill = document.querySelector('#broca');
        if (!isDrillRaised) {
            drill.components.perforacion.data.activo = true;
        } else {
            alert("Baje la broca antes de perforar.");
        }
    }

    stopDrilling() {
        document.querySelector('#broca').components.perforacion.data.activo = false;
    }

    resetOperation() {
        const drill = document.querySelector('#broca');
        drill.components.perforacion.data.profundidad = 0;
        drill.object3D.position.y = 0;
        maxDepthReached = 0;
        document.getElementById('profundidad').textContent = '0 m';
        casingManager.updateCasings(0);
        
        // Reset extraction pipe
        const extractionPipe = document.querySelector('#extraction-pipe');
        extractionPipe.setAttribute("height", 0.1);
        extractionPipe.setAttribute("position", "0 0 -3");
        
        if (drill.components.perforacion) {
            drill.components.perforacion.drillingParams.reset();
        }
    }

    raiseDrill() {
        const drill = document.querySelector("#broca");
        if (drill.components.perforacion.data.activo) {
            alert("Detenga la perforación antes de subir la broca.");
            return;
        }
        isDrillRaised = true;
        const targetY = Math.max(-maxDepthReached, 0);
        this.animateDrill(drill, targetY, () => {
            alert("Broca elevada. Ahora puede cambiarla.");
        });
    }

    lowerDrill() {
        const drill = document.querySelector("#broca");
        const targetY = -maxDepthReached;
        this.animateDrill(drill, targetY, () => {
            isDrillRaised = false;
            alert("Broca bajada. Puede continuar la perforación.");
        });
    }

    changeBit(type) {
        if (!isDrillRaised) {
            alert("Debe elevar la broca antes de cambiarla.");
            return;
        }
        bitManager.changeBit(type);
        // Reset bit wear when changing bit
        const drill = document.querySelector('#broca');
        if (drill && drill.components.perforacion) {
            drill.components.perforacion.drillingParams.reset();
        }
        alert(`Broca cambiada a ${type}. Bajando automáticamente...`);
        this.lowerDrill();
    }

    setTimeMultiplier(value) {
        timeMultiplier = value;
    }

    updateCameraHeight(value) {
        const height = this.initialCameraY + (-7500 * (value / 100));/* 14.000 */
        this.camera.object3D.position.y = height;
    }

    animateDrill(drill, targetY, callback) {
        let currentY = drill.object3D.position.y;
        let speed = config.animationSpeed * timeMultiplier;
        
        const step = () => {
            if (Math.abs(currentY - targetY) < speed) {
                drill.object3D.position.y = targetY;
                callback();
                return;
            }
            currentY += currentY > targetY ? -speed : speed;
            drill.object3D.position.y = currentY;
            requestAnimationFrame(step);
        };
        step();
    }

    updateDrillingParameter(param, value) {
        if (!this.camera) return;
        const drill = document.querySelector('#broca');
        if (!drill || !drill.components.perforacion) return;
        
        drill.components.perforacion.drillingParams.setParameter(param, value);
        
        // Update display values
        const displayElement = document.getElementById(`${param}-value`);
        if (displayElement) {
            let displayValue = value;
            switch(param) {
                case 'mudDensity':
                    displayValue += ' g/cm³';
                    break;
                case 'rotationSpeed':
                    displayValue += ' RPM';
                    break;
                case 'mudFlow':
                    displayValue += ' L/min';
                    break;
                case 'weightOnBit':
                    displayValue += ' kN';
                    break;
            }
            displayElement.textContent = displayValue;
        }
    }

    updateResourcePercentage(type, value) {
        const drill = document.querySelector('#broca');
        if (!drill || !drill.components.perforacion) return;
        
        drill.components.perforacion.drillingParams.updateResourcePercentage(type, parseFloat(value));
        this.updateResourcePercentageDisplays();
    }

    updateResourcePercentageDisplays() {
        const resources = config.drillingParams.resources;
        resources.forEach(resource => {
            const display = document.getElementById(`${resource.type}-percentage-value`);
            if (display) {
                display.textContent = `${Math.round(resource.percentage)}%`;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for A-Frame to be ready
    if (document.querySelector('a-scene').hasLoaded) {
        window.drillControls = new DrillControls();
    } else {
        document.querySelector('a-scene').addEventListener('loaded', () => {
            window.drillControls = new DrillControls();
        });
    }
});
