import uniqueId from "lodash.uniqueid";
import * as constants from "./constants";

let sourceNum = 4;
let sourceColors = [];
let sourceMasses = [];
for (let i = 1; i <= sourceNum; i++) {
    let num = 360 / sourceNum * i;
    sourceColors.push(`hsl(${num}, 100%, 50%)`);
    sourceMasses.push(constants.EarthMass * i);
}

function Attractor(game, center) {
    this.type = "attractor";
    this.id = uniqueId();
    this.game = game;
    this.center = center;
    this.color = sourceColors.shift(); //'#' + Math.floor(Math.random() * 16777215).toString(16);

    this.mass = sourceMasses.shift();
    this.radius = this.mass / constants.EarthMass * constants.EarthRadius;
}

Attractor.prototype.update = function () {};

export default Attractor;