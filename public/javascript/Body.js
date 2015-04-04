import uniqueId from "lodash.uniqueid";

import Vector from "./Vector.js";
import presenceTracker from "./presenceTracker";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";
let point = pointUtils.point;

function randomNum(min, max) {
    return min + Math.random() * (max - min);
}

function Body(game, center, isManual, options = {}) {
    this.game = game;
    this.isManual = isManual;
    this.center = center;

    this.originalCenter = { x: center.x, y: center.y };

    this.isAlive = true;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();

    this.mass = constants.EarthMass / 2;
    this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

    this.initalVector = new Vector(
        options.force === undefined ? 1e25 : options.initialForce,
        options.direction === undefined ? Math.PI : options.direction
    );

    this.speed = 0;
}

Body.prototype.update = function() {
    let timeSinceUpdate = this.timeSinceUpdate();

    let acceleration = (vector) => vector.length / this.mass;

    let speed        = (vector) => this.speed + (acceleration(vector) * timeSinceUpdate);
    let distance     = (vector) => speed(vector) * timeSinceUpdate;
    let deltaX       = (vector) => distance(vector) * Math.cos(vector.direction);
    let deltaY       = (vector) => distance(vector) * Math.sin(vector.direction);

    let vectors = this.game.attractors.map(attractor => {
        let force = constants.G * this.mass * attractor.mass / Math.pow(pointUtils.distanceBetween(this.center, attractor.center), 2);

        return new Vector(
            force,
            Math.atan2(
                this.center.y - attractor.center.y,
                this.center.x - attractor.center.x
            ) + Math.PI
        );
    });

    let finalVector = vectors.reduce(function addVectors(vecA, vecB) { return vecA.add(vecB); });
    let tempFinalVector = finalVector;
    finalVector = finalVector.add(this.initalVector);

    let finalDeltaX = deltaX(finalVector);
    let finalDeltaY = deltaY(finalVector);

    if (this.timeSinceCreation() > 60 * 1000) { // 60 seconds
        this.isAlive = false;
        return;
    }

    if (this.center.x < 0 || this.center.x > this.game.realSize.x || this.center.y < 0 || this.center.y > this.game.realSize.y) {
        this.isAlive = false;
        return;
    }

    this.isAlive = !pointUtils.willCollide(this.center, finalDeltaX, finalDeltaY, this.game.attractors, source => {
        if (this.isManual) return;
        let deadBody = {
            color: source.color,
            center: point(this.originalCenter.x, this.originalCenter.y),
            radius: this.radius
        };
        this.game.deadBodies.push(deadBody);
    });

    this.center.x += finalDeltaX;
    this.center.y += finalDeltaY;
    // console.log('ax,ay', constants.fromReal(this.center.x), constants.fromReal(this.center.y));

    this.speed = speed(finalVector);
    this.updatedAt = Date.now();
};

Body.prototype.timeSinceUpdate = function () {
    return Date.now() - presenceTracker.timeOffPage - this.updatedAt;
};

Body.prototype.timeSinceCreation = function () {
    return Date.now() - presenceTracker.timeOffPage - this.createdAt;
};

export default Body;