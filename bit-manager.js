import { config } from './config.js';

export class BitManager {
    changeBit(type) {
        document.getElementById("broca").setAttribute("color", config.bitColors[type] || "#ffffff");
    }
}

