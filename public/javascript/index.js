import uniq from "lodash.uniq";
import pick from "lodash.pick";

import presenceTracker from "./presenceTracker";

import Attractor from "./Attractor";
import Cannon from "./Cannon";
import Body from "./Body";

import * as canvasDraw from "./canvasDraw";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";

function Game() {
    let canvas = document.getElementById("canvas");

    canvas.style.position = "absolute";
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');
    this.screen = screen;
    screen.font = "10pt Arial";

    canvasDraw.setScreen(this.screen);

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };
    this.realSize = { x: constants.toReal(this.size.x), y: constants.toReal(this.size.y) };

    this.deadBodies = [];
    this.bodies = [];
    this.attractors = [];
    this.cannons = [];

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

    let currentAttractor;

    canvas.addEventListener("mousedown", (e) => {
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
            let inAttractorData = this.pointInAttractor(point);
            if (inAttractorData) {
                let { attractor } = inAttractorData;

                currentAttractor = attractor;
            } else {
                this.attractors.push(new Attractor(this, point));

            }
        } else if (closestCannon && closestCannon.distance <= constants.toReal(100)) {
            let cannon = closestCannon.cannon;
            cannon.select(point);
        } else {
            spawnBody(point, true);
        }
    });

    canvas.addEventListener("mousemove", e => {
        let {clientX, clientY} = e;

        if (currentAttractor) {
            currentAttractor.center = pointUtils.toReal({ x: clientX, y: clientY });
        }
    });

    canvas.addEventListener("mouseup", e => {
        let {clientX, clientY} = e;

        if (currentAttractor) {
            currentAttractor.center = pointUtils.toReal({ x: clientX, y: clientY });
        }

        currentAttractor = null;
    });


    let tick = () => {
        screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
        this.update();
        this.draw();
        requestAnimationFrame(tick);
    };

    this.updatedAt = Date.now();
    requestAnimationFrame(tick);
}

Game.prototype.pointInAttractor = function (point) {
    let distanceTo = attractor => Math.ceil(pointUtils.distanceBetween(point, attractor.center));

    let minumumData = null;

    this.attractors.forEach(attractor => {
        let distance = distanceTo(attractor);
        if (minumumData === null || distance < minumumData.distance) {
            minumumData = { distance, attractor };
        }
    });

    if (minumumData && minumumData.attractor.radius >= minumumData.distance) {
        return minumumData;
    }

    return null;
};

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
    screen.fillText("Bodies: " + this.bodies.length, 1, this.size.y);
};

Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });