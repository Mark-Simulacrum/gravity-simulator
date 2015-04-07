import * as constants from "./constants";

let initNum = 1;
function Attractor(game, center) {
    this.type = "attractor";
    this.id = initNum;
    this.initNum = initNum;

    this.game = game;
    this.center = center;
    this.mass = constants.EarthMass * 2 * initNum;

    this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

    initNum++;
}

Attractor.prototype.update = function () {
    this.color = `hsl(${360 / this.game.attractors.length * this.initNum}, 100%, 50%)`;
};

export default Attractor;