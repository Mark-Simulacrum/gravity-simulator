import {EventEmitter} from "events";
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

class Keyboarder extends EventEmitter {
    constructor() {
        super();

        this.keyState = {};

        this.Keys = {
            shift: 16,
            ctrl: 17,
            keypadPlus: 107,
            keypadMinus: 109,
            equalSign: 187,
            dash: 189,
            a: 65,
            b: 66,
            c: 67,
            d: 68,
            m: 77,
            t: 84
        };

        window.addEventListener("keydown", e => {
            this.keyState[e.keyCode] = true;
            this.emit("keydown", e);
        });
        window.addEventListener("keyup", e => {
            this.keyState[e.keyCode] = false;
            this.emit("keyup", e);
        });
    }
    isDown(keyCode) {
        return this.keyState[keyCode] === true;
    }
    isUp(keyCode) {
        return this.keyState[keyCode] !== true; // handle the undefined case
    }
}

function Game() {
    this.canvas = document.getElementById("canvas");
    this.keyboarder = new Keyboarder();

    let openButton = document.querySelector("#open-button");
    let closeButton = document.querySelector("#close-button");
    let modal = document.querySelector("#directions");

    openButton.addEventListener("click", () => {
        if (modal.style.display !== "table") modal.style.display = "table";
        else modal.style.display = "none";
    });
    closeButton.addEventListener("click", () => modal.style.display = "none");
    // selectedItemDisplay.loadElements();

    this.canvas.style.position = "absolute";
    this.computeSize();
    // selectedItemDisplay.select();

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
    let mouseDown = false;
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

    let processSelected = () => {
        if (!mousePos || !selectedObject) return;

        if (this.keyboarder.isDown(this.keyboarder.Keys.m)) {
            selectedObject.center = mousePos;
        } else if (
            this.keyboarder.isDown(this.keyboarder.Keys.keypadPlus) ||
            (this.keyboarder.isDown(this.keyboarder.Keys.equalSign) && this.keyboarder.isDown(this.keyboarder.Keys.shift))
            ) {
            adjustObject(selectedObject, 1);
        } else if (
            this.keyboarder.isDown(this.keyboarder.Keys.keypadMinus) ||
            this.keyboarder.isDown(this.keyboarder.Keys.dash)
            ) {
            adjustObject(selectedObject, -1);
        } else if (
            this.keyboarder.isDown(this.keyboarder.Keys.d) &&
            this.keyboarder.isUp(this.keyboarder.Keys.shift)
            ) {
            selectedObject.isAlive = false;
        } else if (
            selectedObject.type === "cannon" &&
            this.keyboarder.isDown(this.keyboarder.Keys.t)
            ) {
            selectedObject.select(mousePos);
        }
    };

    let processBodyDelete = () => {
        if (
            this.keyboarder.isDown(this.keyboarder.Keys.shift) &&
            this.keyboarder.isDown(this.keyboarder.Keys.d)
            ) {
            this.bodies = [];
        }
    };

    // For the creation of the "how to do things" panel
    // m: move attractors and cannons
    // +: increase the rate at which cannons fire and the mass of attractors
    // -: decrease the rate at which cannons fire and the mass of attractors
    // d: delete the currently select object
    // t: turn a cannon to point at the current mouse position
    // shift+d: delete all bodies on screen
    // ctrl+a: create an attractor at the current mouse coordinate
    // ctrl+c: create a cannon at the current mouse coordinate
    // ctrl+b: create a body at the current mouse coordinate

    let called = false;
    let processSpawning = () => {
        if (called || !mousePos || !mouseDown || selectedObject) return;

        called = true;

        // Ctrl is down, we may be about to spawn an object
        if (this.keyboarder.isDown(this.keyboarder.Keys.ctrl)) {

            // A is down, create attractor
            if (this.keyboarder.isDown(this.keyboarder.Keys.a)) {
                this.attractors.push(new Attractor(this, mousePos));
            }
            // C is down, create cannon
            else if (this.keyboarder.isDown(this.keyboarder.Keys.c)) {
                spawnCannon(mousePos);
            }
            // B is down, create body
            else if (this.keyboarder.isDown(this.keyboarder.Keys.b)) {
                spawnBody(mousePos, true);
            }
        }
    };

    this.canvas.addEventListener("mousedown", e => {
        let {clientX, clientY} = e;
        const point = pointUtils.toReal({ x: clientX, y: clientY });
        mouseDown = true;

        let clickedObject = getClickedObject(point);

        this.attractors.concat(this.cannons).forEach(object => object.selected = false);
        if (clickedObject) {
            clickedObject.selected = true;
        }
        selectedObject = clickedObject;

        processSelected();
        processSpawning();
    });

    this.canvas.addEventListener("mouseup", () => {
        mouseDown = false;
        called = false;
    });

    this.canvas.addEventListener("mousemove", e => {
        let {clientX, clientY} = e;
        const point = pointUtils.toReal({ x: clientX, y: clientY });
        mousePos = point;

        processSelected();
    });

    this.keyboarder.on("keydown", () => {
        processSelected();
        processSpawning();
        processBodyDelete();
    });

    this.keyboarder.on("keyup", () => {
        processSelected();
        processSpawning();
        processBodyDelete();
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