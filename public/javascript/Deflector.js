import * as constants from "./constants";
import Attractor from "./Attractor";

let initNum = 1;
export default class Deflector extends Attractor {
    constructor(game, center) {
        super(game, center);

        this.type = "deflector";
        this.id = initNum;
        this.isAlive = true;

        this.game = game;
        this.center = center;
        this.mass = constants.EarthMass * 4;

        this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

        this.color = `#2b008f`;

        initNum++;
    }
    calculateMass() {
        this.mass = this.radius / constants.EarthRadius * constants.EarthMass;
    }
    update() {
        
    }
}
