import * as constants from "./constants";

let initNum = 1;
export default class Attractor{
    constructor(game, center) {
        this.type = "attractor";
        this.id = initNum;
        this.isAlive = true;

        this.game = game;
        this.center = center;
        this.mass = constants.EarthMass * 4;

        this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

        initNum++;
    }
    calculateMass() {
        this.mass = this.radius / constants.EarthRadius * constants.EarthMass;
    }
    update() {
        this.color = `hsl(${360 / this.game.attractors.length * this.id}, 100%, 50%)`;
    }
}
