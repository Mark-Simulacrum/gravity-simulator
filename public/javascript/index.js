import uniq from "lodash.uniq";
import pick from "lodash.pick";

import presenceTracker from "./presenceTracker";

import Attractor from "./Attractor";
import Cannon from "./Cannon";
import Body from "./Body";

import * as canvasDraw from "./canvasDraw";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";
let point = pointUtils.point;

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
    this.cannons = [];

    // this.attractors.push(new Attractor(this, {
    //     x: constants.toReal(this.size.x / 4), y: constants.toReal(this.size.y / 4) // left left top
    // }));
    // this.attractors.push(new Attractor(this, {
    //     x: constants.toReal(this.size.x / 4 * 3) , y: constants.toReal(this.size.y / 4) // left right top
    // }));
    // this.attractors.push(new Attractor(this, {
    //     x: constants.toReal(this.size.x / 4), y: constants.toReal(this.size.y / 4 * 3) // left left bottom
    // }));
    this.attractors.push(new Attractor(this, {
        x: constants.toReal(this.size.x / 4 * 3), y: constants.toReal(this.size.y / 4 * 3) // right right bottom
    }));

    let intervalId, timeoutId;

    let spawnBody = (point, isManual = false) => {
        this.addBody(new Body(this, point, isManual));
    };

    let spawnCannon = (point) => {
        let comparePoint = pointUtils.fromReal(point);
        let toPoint = pointUtils.toReal({
            x: comparePoint.x === this.size.x ? 0 : comparePoint.x === 0 ? this.size.x : comparePoint.x,
            y: comparePoint.y === this.size.y ? 0 : comparePoint.y === 0 ? this.size.y : comparePoint.y
        });

        this.cannons.push(new Cannon(this, point, toPoint));
    };

    // const interval = 20;
    // const distance = 20 * 7;
    // const planetRowAX = this.size.x / 4;
    // const planetRowAY = this.size.y / 4;
    // const planetRowBX = this.size.x / 4 * 3;
    // const planetRowBY = this.size.y / 4 * 3;
    // for (let y =  planetRowAY - distance; y <= planetRowAY + distance; y += interval) {
    //     setTimeout(() => {
    //         spawnCannon(pointUtils.toReal({ x: this.size.x, y }));
    //     });
    // }

    // for (let y = planetRowBY - distance; y <= planetRowBY + distance; y += interval) {
    //     setTimeout(() => {
    //         spawnCannon(pointUtils.toReal({ x: this.size.x, y }));
    //     });
    // }

    // for (let x =  planetRowAX - distance; x <= planetRowAX + distance; x += interval) {
    //     setTimeout(() => {
    //         spawnCannon(pointUtils.toReal({ x: x, y: 0 }));
    //     });
    // }

    // for (let x = planetRowBX - distance; x <= planetRowBX + distance; x += interval) {
    //     setTimeout(() => {
    //         spawnCannon(pointUtils.toReal({ x: x, y: 0 }));
    //     });
    // }

    canvas.addEventListener("click", (e) => {
        let {clientX, clientY} = e;

        const point = {
            x: constants.toReal(clientX),
            y: constants.toReal(clientY)
        };

        let closestCannon = this.cannonNearPoint(point);

        if (e.ctrlKey) {
            console.log("new cannon");
            spawnCannon(point);
        } else if (e.shiftKey) {
            console.log("new planet");
            this.attractors.push(new Attractor(this, point));
        } else if (closestCannon && closestCannon.distance <= constants.toReal(100)) {
            let cannon = closestCannon.cannon;
            cannon.select(point);
        } else {
            console.log("d:", closestCannon && constants.fromReal(closestCannon.distance));
            spawnBody(point, true);
        }
    });


    let tick = () => {
        screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
        this.update();
        this.draw();
        requestAnimationFrame(tick);
    };

    // let speed = 7000;
    // for (let x = 0; x <= this.size.x; x += 20, speed += 700) {
    //     let hue = speed / (10 * 7000) * (360 - 200) + 200;
    //     let point = pointUtils.toReal({x, y: 10});
    //     console.log(hue, speed);
    //     canvasDraw.drawPoint(point, `hsl(${hue}, 100%, 30%)`, 10);
    // }

    this.updatedAt = Date.now();
    requestAnimationFrame(tick);
}

Game.prototype.cannonNearPoint = function (point) {
    let distanceTo = (cannon) => Math.ceil(pointUtils.distanceBetween(point, cannon.center));

    let distances = this.cannons.map(cannon => distanceTo(cannon));

    let minumumDistance = Math.min.apply(Math, distances);

    let returnVal = null;
    this.cannons.some(cannon => {
        if (distanceTo(cannon) === minumumDistance) {
            returnVal = { cannon, distance: minumumDistance };
        }
    });

    return returnVal;
};

Game.prototype.update = function() {
    const now = Date.now();
    let timeSinceUpdate = (now - this.updatedAt) * constants.TimeScale;
    timeSinceUpdate = Math.min(500, timeSinceUpdate);
    this.updatedAt = now;

    this.attractors.forEach(attractor => attractor.update());

    this.bodies.forEach(body => body.update(timeSinceUpdate)); // Update must run before cleanup of dead bodies
    this.bodies = this.bodies.filter(body => body.isAlive);

    this.cannons.forEach(cannon => cannon.update());
};

Game.prototype.draw = function() {
    let screen = this.screen;

    this.deadBodies.forEach(deadBody => {
        canvasDraw.drawBody(deadBody);
    });

    this.bodies
        // .filter(body => body.isManual)
        .forEach(canvasDraw.drawBody);

    this.attractors.forEach(canvasDraw.drawBody);
    this.cannons.forEach(canvasDraw.drawBody);

    canvasDraw.setColor("black");
    screen.fillText("Bodies: " + this.bodies.length, 5, this.size.y - 5);
};

Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });