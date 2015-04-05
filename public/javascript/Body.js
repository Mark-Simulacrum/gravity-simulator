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
    this.id = uniqueId("body");

    this.originalCenter = { x: center.x, y: center.y };

    this.isAlive = true;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();

    this.mass = constants.EarthMass / 2;
    this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

    let initalVector = options.initialSpeed !== undefined ? options.initialSpeed : new Vector(
        5000,
        0,
        "m/s"
    );

    this.speed = {
        injection: initalVector,
        orthogonalInj: new Vector(0, 0, "m/s")
    };
}

Body.prototype.update = function(timeSinceUpdate) {
    let acceleration = (vector) => vector.length / this.mass;
    let speedNow = (speed, force) => speed.length + acceleration(force) * timeSinceUpdate;

    let distanceTravelled = (speed, force) => speed.length * timeSinceUpdate;
    let shift = (speed, force) => {
        return {
            x: distanceTravelled(speed, force) * Math.cos(force.direction),
            y: distanceTravelled(speed, force) * Math.sin(force.direction)
        };
    };

    let vectors = this.game.attractors.map(attractor => {
        let force = constants.G * this.mass * attractor.mass / Math.pow(pointUtils.distanceBetween(this.center, attractor.center), 2);

        return new Vector(
            force,
            Math.atan2(
                this.center.y - attractor.center.y,
                this.center.x - attractor.center.x
            ) + Math.PI,
            "N"
        );
    });

    let planetsVector = vectors.reduce((vecA, vecB) => vecA.add(vecB));
    let projectedVectors = planetsVector.projectionOnto(this.speed.injection);

    this.speed.injection.length = speedNow(this.speed.injection, projectedVectors.a);
    this.speed.orthogonalInj.length = speedNow(this.speed.orthogonalInj, projectedVectors.b);
    let delta = {
        a: shift(this.speed.injection, projectedVectors.a),
        b: shift(this.speed.orthogonalInj, projectedVectors.b)
    };

    delta.x = delta.a.x + delta.b.x;
    delta.y = delta.a.y + delta.b.y;

    // if (this.timeSinceCreation() > 120 * 1000) { // 60 seconds
    //     this.isAlive = false;
    //     return;
    // }

    // if (this.center.x < 0 || this.center.x > this.game.realSize.x || this.center.y < 0 || this.center.y > this.game.realSize.y) {
    //     this.isAlive = false;
    //     return;
    // }

    this.isAlive = !pointUtils.willCollide(this.center, delta.x, delta.y, this.game.attractors, attractor => {
        if (this.isManual) return;
        let deadBody = {
            color: attractor.color,
            center: point(this.originalCenter.x, this.originalCenter.y),
            radius: this.radius,
            id: this.id
        };
        this.game.deadBodies.push(deadBody);
    });

    this.center.x += delta.x;
    this.center.y += delta.y;

    console.log("center", this.center);
    console.log("orthogonal vector", this.speed.injection);
    console.log("injection vector", this.speed.orthogonalInj);

    this.color = `hsl(${planetsVector.direction * 180 / Math.PI}, 100%, 30%)`;
    this.updatedAt = Date.now();
};

Body.prototype.timeSinceUpdate = function () {
    return Date.now() - presenceTracker.timeOffPage - this.updatedAt;
};

Body.prototype.timeSinceCreation = function () {
    return Date.now() - presenceTracker.timeOffPage - this.createdAt;
};

export default Body;