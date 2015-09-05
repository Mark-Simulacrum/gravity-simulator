import Mousetrap from "mousetrap";
import throttle from "lodash.throttle";
import find from "lodash.find";

import Attractor from "./Attractor";
import Deflector from "./Deflector";
import Cannon from "./Cannon";
import Body from "./Body";

import * as canvasDraw from "./canvasDraw";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";

function Game() {
    this.canvas = document.getElementById("canvas");
    this.infoElement = document.getElementById("gen-info-text");

    this.canvas.style.position = "absolute";
    this.computeSize();

    // Get the drawing context.
    this.screen = this.canvas.getContext('2d');
    this.screen.font = "10pt Arial";

    canvasDraw.setScreen(this.screen);

    this.deadBodies = [];
    this.bodies = [];
    this.attractors = [];
    this.deflectors = [];
    this.cannons = [];
    this.selectedObject = null;

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

    let getClickableObjects = () => this.attractors.concat(this.cannons, this.deflectors);
    let getClickedObject = point => {
        return find(getClickableObjects(), object => {
            let distance = pointUtils.distanceBetween(object.center, point);

            // User clicked within a 50px circle or the object's radius around the center of the object
            if (distance <= object.radius) {
                return object;
            }
        });
    };

    let mousePos;

    let adjustObject = (object, adjustment) => {
        if (object.type === "attractor" || object.type === "deflector") {
            if (this.selectedObject.radius > constants.toReal(1)) {
                this.selectedObject.radius += constants.toReal(adjustment);
                this.selectedObject.calculateMass();
            }
        } else if (object.type === "cannon") {
            adjustment = -adjustment;
            if (this.selectedObject.rate > 1) {
                this.selectedObject.rate += adjustment; // The + should make the rate faster, - slower
            } else if (this.selectedObject.rate === 1 && adjustment > 0) {
                this.selectedObject.rate += adjustment;
            }
        }
    };

    let moveObject = (direction) => {
        if (this.selectedObject) {
            console.log(direction)
            if (direction === "up" || direction === "down") {
                this.selectedObject.center.y += (direction === "up" ? constants.toReal(-1) : constants.toReal(1));
            } else {
                this.selectedObject.center.x += (direction === "right" ? constants.toReal(1) : constants.toReal(-1));
            }
        }
    };

    Mousetrap.bind("up", () => moveObject("up"));
    Mousetrap.bind("down", () => moveObject("down"));
    Mousetrap.bind("left", () => moveObject("left"));
    Mousetrap.bind("right", () => moveObject("right"));

    Mousetrap.bind("m", () => {
        if (mousePos && this.selectedObject) {
            this.selectedObject.center = mousePos;
        }
    });

    Mousetrap.bind("k", () => {
        if (mousePos && this.selectedObject) {
            this.selectedObject.isAlive = false;
        }
    });

    Mousetrap.bind("+", () => {
        if (mousePos && this.selectedObject) {
            adjustObject(this.selectedObject, +1);
        }
    });

    Mousetrap.bind("-", () => {
        if (mousePos && this.selectedObject) {
            adjustObject(this.selectedObject, -1);
        }
    });

    Mousetrap.bind("t", () => {
        if (mousePos && this.selectedObject && this.selectedObject.type === "cannon") { // Selected object is a cannon
            this.selectedObject.select(mousePos);
        }
    });

    Mousetrap.bind("shift+b", () => {
        this.bodies = [];
    });

    Mousetrap.bind("shift+a", () => {
        this.attractors = [];
    });

    Mousetrap.bind("shift+d", () => {
        this.deflectors = [];
    });

    Mousetrap.bind("shift+c", () => {
        this.cannons = [];
    });

    let processSpawning = (type) => {
        if (mousePos) {
            if (type === "attractor") {
                this.attractors.push(new Attractor(this, mousePos));
            } else if (type === "deflector") {
                this.deflectors.push(new Deflector(this, mousePos));
            } else if (type === "cannon") {
                spawnCannon(mousePos);
            } else if (type === "body") {
                spawnBody(mousePos, true);
            }
        }
    };

    processSpawning = throttle(processSpawning, 50, { leading: true, trailing: false });

    Mousetrap.bind("a", () => {
        processSpawning("attractor");
    });

    Mousetrap.bind("d", () => {
        processSpawning("deflector");
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

        getClickableObjects().forEach(object => object.selected = false);
        if (clickedObject) {
            clickedObject.selected = true;
        }

        this.selectedObject = clickedObject;
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

Game.prototype.setInfoText = function (text) {
    this.infoElement.innerHTML = text;
};

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

    this.deflectors.forEach(deflector => deflector.update());
    this.deflectors = this.deflectors.filter(attractor => attractor.isAlive);

    this.bodies.forEach(body => body.update(timeSinceUpdate)); // Update must run before cleanup of dead bodies
    this.bodies = this.bodies.filter(body => body.isAlive);

    this.cannons.forEach(cannon => cannon.update());
    this.cannons = this.cannons.filter(cannon => cannon.isAlive);

    let infoArr = [
        `Bodies: ${this.bodies.length}`,
        `Cannons: ${this.cannons.length}`,
        `Attractors: ${this.attractors.length}`,
        `Deflectors: ${this.deflectors.length}`];

    if (this.selectedObject) {
        infoArr.unshift(`centerX: ${constants.fromReal(this.selectedObject.center.x)}, Y: ${constants.fromReal(this.selectedObject.center.y)}`);
    }

    this.setInfoText(infoArr.join("<br>"));
};

Game.prototype.draw = function() {
    this.bodies
        .forEach(canvasDraw.drawBody);

    this.attractors.forEach(canvasDraw.drawBody);
    this.deflectors.forEach(canvasDraw.drawBody);
    this.cannons.forEach(canvasDraw.drawBody);
};

Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};

window.addEventListener("DOMContentLoaded", () => {
    window.game = new Game();

    let openButton = document.querySelector("#open-button");
    let closeButton = document.querySelector("#close-button");
    let modal = document.querySelector("#directions");

    openButton.addEventListener("click", () => {
        if (modal.style.display !== "table") modal.style.display = "table";
        else modal.style.display = "none";
    });
    closeButton.addEventListener("click", () => modal.style.display = "none");

});
window.addEventListener("resize", () => { window.game.computeSize(); });
