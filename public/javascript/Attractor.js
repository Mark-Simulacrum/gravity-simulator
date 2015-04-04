import uniqueId from "lodash.uniqueid";

let sourceNum = 4;
let sourceColors = [];
let sourceMasses = [];
for (let i = 0; i < sourceNum; i++) {
    let num = 360 / sourceNum * i;
    sourceColors.push(`hsl(${num}, 100%, 50%)`);
    sourceMasses.push(5 * sourceNum - sourceNum * i);
}

function Attractor(game, center) {
    this.id = uniqueId();
    this.game = game;
    this.center = center;
    this.color = sourceColors.shift(); //'#' + Math.floor(Math.random() * 16777215).toString(16);

    let coefficient = Math.pow(10, 1);
    let random = sourceMasses.shift(); /*Math.random() * 10*/
    this.G = 1.1 * random / coefficient;

    this.radius = 1.1 * random * 3 + 10;
}

Attractor.prototype.update = function () {};

export default Attractor;