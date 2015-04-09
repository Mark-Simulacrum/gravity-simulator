import {EventEmitter} from "events";
import Mousetrap from "mousetrap";
import throttle from "lodash.throttle";
import find from "lodash.find";
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
    this.canvas = document.getElementById("canvas");

    let openButton = document.querySelector("#open-button");
    let closeButton = document.querySelector("#close-button");
    let modal = document.querySelector("#directions");

    openButton.addEventListener("click", () => {
        if (modal.style.display !== "table") modal.style.display = "table";
        else modal.style.display = "none";
    });
    closeButton.addEventListener("click", () => modal.style.display = "none");

    this.canvas.style.position = "absolute";
    this.computeSize();

    // Get the drawing context.
    this.screen = this.canvas.getContext('2d');
    this.screen.font = "10pt Arial";

    canvasDraw.setScreen(this.screen);

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

    let getClickedObject = point => {
        return find(this.attractors.concat(this.cannons), object => {
            let distance = pointUtils.distanceBetween(object.center, point);

            // User clicked within a 50px circle or the object's radius around the center of the object
            if (distance <= object.radius) {
                return object;
            }
        });
    };

    let selectedObject;
    let mousePos;

    let adjustObject = (object, adjustment) => {
        if (object.type === "attractor") {
            if (selectedObject.radius > constants.toReal(1)) {
                selectedObject.radius += constants.toReal(adjustment);
                selectedObject.calculateMass();
            }
        } else if (object.type === "cannon") {
            adjustment = -adjustment;
            if (selectedObject.rate > 1) {
                selectedObject.rate += adjustment; // The + should make the rate faster, - slower
            } else if (selectedObject.rate === 1 && adjustment > 0) {
                selectedObject.rate += adjustment;
            }
        }
    };

    Mousetrap.bind("m", () => {
        if (mousePos && selectedObject) {
            selectedObject.center = mousePos;
        }
    });

    Mousetrap.bind("d", () => {
        if (mousePos && selectedObject) {
            selectedObject.isAlive = false;
        }
    });

    Mousetrap.bind("+", () => {
        if (mousePos && selectedObject) {
            adjustObject(selectedObject, +1);
        }
    });

    Mousetrap.bind("-", () => {
        if (mousePos && selectedObject) {
            adjustObject(selectedObject, -1);
        }
    });

    Mousetrap.bind("t", () => {
        if (mousePos && selectedObject && selectedObject.type === "cannon") { // Selected object is a cannon
            selectedObject.select(mousePos);
        }
    });

    Mousetrap.bind("shift+d", () => {
        this.bodies = [];
    });

    let processSpawning = (type) => {
        if (mousePos) {
            if (type === "attractor") {
                this.attractors.push(new Attractor(this, mousePos));
            } else if (type === "cannon") {
                spawnCannon(mousePos);
            } else if (type === "body") {
                spawnBody(mousePos, true);
            }
        }
    };

    processSpawning = throttle(processSpawning, 100, { leading: true, trailing: false });

    Mousetrap.bind("a", () => {
        console.log("attractor: a");
        processSpawning("attractor");
    });

    Mousetrap.bind("c", () => {
        processSpawning("cannon");
    });

    Mousetrap.bind("b", () => {
        processSpawning("body");
    });

    this.canvas.addEventListener("mousedown", e => {
        let {clientX, clientY} = e;
        const point = pointUtils.toReal({ x: clientX, y: clientY });
        mousePos = point;

        let clickedObject = getClickedObject(point);

        this.attractors.concat(this.cannons).forEach(object => object.selected = false);
        if (clickedObject) {
            clickedObject.selected = true;
        }

        selectedObject = clickedObject;
    });

    this.canvas.addEventListener("mousemove", e => {
        let {clientX, clientY} = e;
        const point = pointUtils.toReal({ x: clientX, y: clientY });
        mousePos = point;
    });

    let tick = () => {
        this.screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
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

Game.prototype.computeSize = function() {
    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;

    this.size = { x: this.canvas.width, y: this.canvas.height };
    this.realSize = { x: constants.toReal(this.size.x), y: constants.toReal(this.size.y) };
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
    this.attractors = this.attractors.filter(attractor => attractor.isAlive);

    this.bodies.forEach(body => body.update(timeSinceUpdate)); // Update must run before cleanup of dead bodies
    this.bodies = this.bodies.filter(body => body.isAlive);

    this.cannons.forEach(cannon => cannon.update());
    this.cannons = this.cannons.filter(cannon => cannon.isAlive);
};

Game.prototype.draw = function() {
    this.deadBodies.forEach(deadBody => {
        canvasDraw.drawBody(deadBody);
    });

    this.bodies
        // .filter(body => body.isManual)
        .forEach(canvasDraw.drawBody);

    this.attractors.forEach(canvasDraw.drawBody);
    this.cannons.forEach(canvasDraw.drawBody);

    canvasDraw.setColor("black");
    this.screen.fillText("Bodies: " + this.bodies.length, 1, this.size.y);
};

Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });
window.addEventListener("resize", () => { global.game.computeSize(); });