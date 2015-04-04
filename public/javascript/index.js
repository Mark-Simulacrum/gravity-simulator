import uniq from "lodash.uniq";
import pick from "lodash.pick";

import * as pointUtils from "./pointUtils";
let point = pointUtils.point;
import * as canvasDraw from "./canvasDraw";
import presenceTracker from "./presenceTracker";
import Attractor from "./Attractor";
import Body from "./Body";

const universalGravitationalConstant = 6.673 * Math.pow(10, -11);

function uniquePairs(array) {
    let pairs = [];
    for (var i = 0; i < array.length; i++) {
        for (var j = i + 1; j < array.length; j++) {
            pairs.push([
                array[i], array[j]
            ]);
        }
    }
    return pairs;
}

function randomNum(min, max) {
    return min + Math.random() * (max - min);
}

function Game() {
    let canvas = document.getElementById("canvas");

    canvas.width = document.body.clientWidth - 10;
    canvas.height = document.body.clientHeight - 10;

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');
    this.screen = screen;
    screen.font = "20pt Arial";

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };

    this.deadBodies = [];
    this.bodies = [];
    this.sources = [];
    this.attractors = [];

    let fudgePercent = 0;
    let fFX = () => { let random = this.size.x * fudgePercent; return randomNum(-random, +random); };
    let fFY = () => { let random = this.size.y * fudgePercent; return randomNum(-random, +random); };
    this.sources.push(new Attractor(this, { x: this.size.x / 4 + fFX(), y: this.size.y / 4 + fFY() }));
    this.sources.push(new Attractor(this, {x: this.size.x / 4 * 3 + fFX(), y: this.size.y / 4 + fFY()}));
    this.sources.push(new Attractor(this, {x: this.size.x / 4 + fFX(), y: this.size.y / 4 * 3 + fFY()}));
    this.sources.push(new Attractor(this, {x: this.size.x / 4 * 3 + fFX(), y: this.size.y / 4 * 3 + fFY()}));

    let intervalId, timeoutId;

    let spawnBody = (point, isManual = false) => {
        this.addBody(new Body(this, point, isManual));
    };

    let spawnRandomBody = () => {
        let bodyCenter = {
            x: randomNum(0, this.size.x),
            y: randomNum(0, this.size.y)
        };
        spawnBody(bodyCenter, true);
    };
    setInterval(spawnRandomBody, 10);

    global.spawnBodies = true;

    let spawnBodyAtCoord = function (x, y) {
        return function () {
            spawnBody({ x, y });
        };
    };

    let interval = 20;
    for (var x = 0; x <= this.size.x; x += interval) {
        for (var y = 0; y <= this.size.y; y += interval) {
            setTimeout(spawnBodyAtCoord(x, y));
        }
    }

    function pointSort(a, b) {
        let centerA = a.center;
        let centerB = b.center;
        if (centerA.x < centerB.x || centerA.y < centerB.y) {
            return -1;
        } else if (centerA.x === centerB.x && centerA.y === centerB.y) {
            return 0;
        } else { // centerB is "greater" than centerA
            return 1;
        }
    }

    canvas.addEventListener("click", ({clientX, clientY}) => {
        spawnBody(point(clientX, clientY), true);
    });

    let tick = () => {
        screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
        this.update();
        this.draw();

        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
}

Game.prototype.update = function() {
    this.sources.forEach(source => source.update());

    this.bodies = this.bodies.filter(function cleanDeadBodies(body) {
        return body.isAlive;
    });

    this.bodies.forEach(body => body.update());
};

Game.prototype.draw = function() {
    let screen = this.screen;

    this.deadBodies.forEach(deadBody => {
        canvasDraw.setColor(this.screen, deadBody.color);
        canvasDraw.drawBody(this.screen, deadBody);
    });
    canvasDraw.setColor(screen, "black");
    this.bodies.filter(body => body.isManual).forEach(body => canvasDraw.drawBody(screen, body));
    // this.deadBodies = [];

    this.sources.forEach(source => {
        canvasDraw.setColor(screen, source.color);
        canvasDraw.drawBody(screen, source);
        canvasDraw.setColor(screen, "black");
        screen.beginPath();
        screen.arc(source.center.x, source.center.y, source.radius, 0, 2 * Math.PI, false);
        screen.stroke();
    });

    // canvasDraw.setColor(screen, "red");
    // this.attractors.forEach(attractor => canvasDraw.drawBody(screen, attractor));

    // canvasDraw.setColor(screen, "black");
    // screen.fillText("Bodies: " + this.bodies.length, 5, this.size.y - 5);
};

Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });