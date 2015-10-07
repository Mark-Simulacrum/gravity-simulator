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
    this.screen = this.canvas.getContext("2d");
    this.screen.font = "10pt Arial";

    canvasDraw.setScreen(this.screen);

    this.timesSinceUpdate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.deadBodies = [];
    this.bodies = [];
    this.attractors = [];
    this.deflectors = [];
    this.cannons = [];
    this.selectedObject = null;

    let spawnBody = (point, isManual = false) => {
        this.bodies.push(new Body(this, point, isManual));
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
            } else if (constants.toReal(adjustment) > 0) {
                this.selectedObject.radius += constants.toReal(adjustment);
            }
            this.selectedObject.calculateMass();
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

    let tick = (highresnow) => {
        this.screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
        this.update(highresnow);
        this.draw();
        requestAnimationFrame(tick);
    };

    this.updatedAt = 0;
    requestAnimationFrame(tick);
}

Game.prototype.setInfoText = function (text) {
    this.infoElement.innerHTML = text;
};

Game.prototype.computeSize = function() {
    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;

    this.size = { x: this.canvas.width, y: this.canvas.height };
    this.realSize = { x: constants.toReal(this.size.x), y: constants.toReal(this.size.y) };
};

Game.prototype.update = function(now) {
    let timeSinceUpdate = (now - this.updatedAt) * constants.TimeScale;

    this.timesSinceUpdate.shift();
    this.timesSinceUpdate.push(timeSinceUpdate);

    timeSinceUpdate = Math.min(timeSinceUpdate, 20 * constants.TimeScale);
    this.updatedAt = now;

    const gravitationalBodies = this.attractors.concat(this.deflectors);

    for (let deflector of (this.deflectors: Array)) deflector.update(timeSinceUpdate);
    for (let cannon of (this.cannons: Array)) cannon.update(timeSinceUpdate);
    for (let body of (this.bodies: Array)) body.update(timeSinceUpdate, gravitationalBodies);

    this.attractors = this.attractors.filter(attractor => attractor.isAlive);
    this.deflectors = this.deflectors.filter(attractor => attractor.isAlive);
    this.bodies = this.bodies.filter(body => body.isAlive);
    this.cannons = this.cannons.filter(cannon => cannon.isAlive);

    let infoArr = [
        `Bodies: ${this.bodies.length}`,
        `Cannons: ${this.cannons.length}`,
        `Attractors: ${this.attractors.length}`,
        `Deflectors: ${this.deflectors.length}`,
        `Avg time since last update: ${(this.timesSinceUpdate.reduce((a, b) => a + b, 0) / this.timesSinceUpdate.length / constants.TimeScale).toFixed(2)}ms`
    ];

    if (this.selectedObject) {
        const scientificNotation = this.selectedObject.mass.toExponential();
        const scientificNotationRe = /(\d)\.?(\d{0,3})?(\d*?)e\+(\d+)/;
        const [, base, decimals, { length: numOfExtra }, power ] = scientificNotationRe.exec(scientificNotation);
        const modifiedNotation = `${base}${decimals ? `.${decimals}` : ""} &times; 10 ^ ${power - numOfExtra}`;

        infoArr.unshift(`Mass: ${(this.selectedObject.mass/constants.EarthMass).toFixed(2)} Earth masses or ${modifiedNotation} kg`);
        infoArr.unshift(`Center: (${constants.fromReal(this.selectedObject.center.x)}px, ${constants.fromReal(this.selectedObject.center.y)}px)`);
    }

    this.setInfoText(infoArr.join("<br>"));
};

Game.prototype.draw = function() {
    for (let object of (this.bodies.concat(this.attractors, this.deflectors, this.cannons): Array))
        canvasDraw.drawBody(object);
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
