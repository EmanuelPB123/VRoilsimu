export const config = {
    drillSpeed: 0.02,  // Base drilling speed in meters per tick
    animationSpeed: 0.05,
    defaultBit: 'tricone',
    bitColors: {
        tricone: "#0074ff",
        pdc: "#ff0000",
        diamond: "#ffb900",
        coring: "#000000"
    },
    casings: [
        { id: "casing-conductor", minDepth: 30, maxDepth: 300, radius: 0.4, color: "#FF4D4D" },
        { id: "casing-superficie", minDepth: 300, maxDepth: 1500, radius: 0.3, color: "#4DFF4D" },
        { id: "casing-intermedio", minDepth: 1500, maxDepth: 4000, radius: 0.25, color: "#4D4DFF" },
        { id: "casing-produccion", minDepth: 4000, maxDepth: 14000, radius: 0.2, color: "#FFD700" }
    ],
    layers: [
        { name: "Arenisca", startDepth: 0, endDepth: 100, hardness: 0.8, color: "#FFE4B5" },
        { name: "Lutita", startDepth: 100, endDepth: 300, hardness: 1.2, color: "#696969" },
        { name: "Caliza", startDepth: 300, endDepth: 500, hardness: 1.5, color: "#F5F5F5" },
        { name: "Dolomita", startDepth: 500, endDepth: 700, hardness: 1.7, color: "#DEB887" },
        { name: "Granito", startDepth: 700, endDepth: 1000, hardness: 2.5, color: "#FFA07A" },
        { name: "Basalto", startDepth: 1000, endDepth: 1200, hardness: 2.8, color: "#4A4A4A" },
        { name: "Gabro", startDepth: 1200, endDepth: 5000, hardness: 3.0, color: "#2F4F4F" }
    ],
    extractionPipe: {
        radius: 0.1,
        color: "#00FF00",
        opacity: 0.9
    },
    drillingParams: {
        pressureGradient: 0.052,     // PSI per foot of depth
        tempGradient: 25,            // °C per 1000m
        initialTemp: 20,             // Surface temperature in °C
        mudDensityBase: 1.0,         // g/cm³
        mudDensityRange: { min: 0.8, max: 2.5 },
        rotationSpeedBase: 120,      // RPM
        rotationSpeedRange: { min: 10, max: 2000 },
        mudFlowBase: 250,            // L/min
        mudFlowRange: { min: 0, max: 500 },
        weightOnBitBase: 25,         // kN
        weightOnBitRange: { min: 0, max: 50 },
        resources: [
            { type: 'water', minDepth: 10, maxDepth: 500, percentage: 33 },
            { type: 'gas', minDepth: 600, maxDepth: 5000, percentage: 33 },
            { type: 'oil', minDepth: 600, maxDepth: 7000, percentage: 34 }
        ]
    }
};