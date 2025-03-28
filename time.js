(function () {
    let timeMultiplier = 1; // Factor de aceleración
    let lastTime = performance.now();

    function updateTime() {
        let now = performance.now();
        let deltaTime = (now - lastTime) * timeMultiplier;
        lastTime = now;

        if (window.drillControls && typeof window.drillControls.update === "function") {
            window.drillControls.update(deltaTime / 1000); // Convierte a segundos si es necesario
        }

        requestAnimationFrame(updateTime);
    }

    // Interfaz para cambiar la velocidad desde fuera
    window.setSimulationSpeed = function (multiplier) {
        timeMultiplier = multiplier;
    };

    requestAnimationFrame(updateTime);
})();
