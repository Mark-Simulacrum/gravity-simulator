import uniq from "lodash.uniq";
import pick from "lodash.pick";

import * as pointUtils from "./pointUtils";
let point = pointUtils.point;
import * as canvasDraw from "./canvasDraw";
import presenceTracker from "./presenceTracker";
import Attractor from "./Attractor";
import Body from "./Body";
import * as constants from "./constants";

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

    canvasDraw.setScreen(this.screen);

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };
    this.realSize = { x: constants.toReal(this.size.x), y: constants.toReal(this.size.y) };

    this.deadBodies = [];
    this.bodies = [];
    this.attractors = [];

    this.attractors.push(new Attractor(this, {
        x: constants.toReal(this.size.x / 4), y: constants.toReal(this.size.y / 4) // left left top
    }));
    this.attractors.push(new Attractor(this, {
        x: constants.toReal(this.size.x / 4 * 3) , y: constants.toReal(this.size.y / 4) // left right top
    }));
    this.attractors.push(new Attractor(this, {
        x: constants.toReal(this.size.x / 4), y: constants.toReal(this.size.y / 4 * 3) // left left bottom
    }));
    this.attractors.push(new Attractor(this, {
        x: constants.toReal(this.size.x / 4 * 3), y: constants.toReal(this.size.y / 4 * 3) // right right bottom
    }));

    let intervalId, timeoutId;

    let spawnBody = (point, isManual = false) => {
        point = { x: constants.toReal(point.x), y: constants.toReal(point.y) };
        this.addBody(new Body(this, point, isManual));
    };

    let spawnRandomBody = () => {
        let bodyCenter = {
            x: randomNum(0, this.size.x),
            y: randomNum(0, this.size.y)
        };
        spawnBody(bodyCenter, true);
    };

    let spawnBodyAtCoord = function (x, y) {
        return function () {
            spawnBody({ x, y });
        };
    };

    // setInterval(() => {
    //     spawnBody({ x: this.size.x / 2, y: this.size.y / 2 }, true);
    // }, 100);

    const interval = 10;
    const distance = Math.ceil(this.size.y * 0.1);
    const planetRowAY = this.size.y / 4;
    const planetRowBY = this.size.y / 4 * 3;
    for (let x = 0; x <= this.size.x; x += interval) {
        for (let y =  planetRowAY - distance; y <= planetRowAY + distance; y += interval) {
            setTimeout(spawnBodyAtCoord(x, y));
        }

        for (let y = planetRowBY - distance; y <= planetRowBY + distance; y += interval) {
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
    this.attractors.forEach(attractor => attractor.update());

    this.bodies = this.bodies.filter(function cleanDeadBodies(body) {
        return body.isAlive;
    });

    this.bodies.forEach(body => body.update());
};

Game.prototype.draw = function() {
    let screen = this.screen;

    this.deadBodies.forEach(deadBody => {
        canvasDraw.setColor(deadBody.color);
        canvasDraw.drawBody(deadBody);
    });
    canvasDraw.setColor("black");
    this.bodies
        // .filter(body => body.isManual)
        .forEach(body => canvasDraw.drawBody(body));
    // this.deadBodies = [];

    this.attractors.forEach(attractor => {
        canvasDraw.setColor(attractor.color);
        canvasDraw.drawBody(attractor);
    });

    canvasDraw.setColor("black");
    screen.fillText("Bodies: " + this.bodies.length, 5, this.size.y - 5);
};

Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });