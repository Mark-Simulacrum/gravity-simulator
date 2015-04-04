import uniqueId from "lodash.uniqueid";

import Vector from "./Vector.js";
import presenceTracker from "./presenceTracker";
import * as pointUtils from "./pointUtils";
import * as canvasDraw from "./canvasDraw";
let point = pointUtils.point;

function Body(game, center, isManual) {
    this.isManual = isManual;
    this.originalCenter = { x: center.x, y: center.y };

    this.game = game;
    this.center = center;

    this.isAlive = true;
    this.updatedAt = Date.now();

    this.G = Math.random();
    this.radius = 10;// + 3 * this.G;
    this.speed = Math.random() / 2;
}

Body.prototype.update = function() {
    let timeSinceUpdate = this.timeSinceUpdate();

    let acceleration = (vector) => vector.length / this.G;

    let speed        = (vector) => this.speed + (acceleration(vector) * timeSinceUpdate);
    let distance     = (vector) => speed(vector) * timeSinceUpdate;
    let deltaX       = (vector) => distance(vector) * Math.cos(vector.direction);
    let deltaY       = (vector) => distance(vector) * Math.sin(vector.direction);

    let vectors = this.game.sources.map(source => {
        let force = this.G * source.G / Math.pow(pointUtils.distanceBetween(this.center, source.center), 2);

        return new Vector(
            force,
            Math.atan2(
                this.center.y - source.center.y,
                this.center.x - source.center.x
            ) + Math.PI
        );
    });

    let finalVector = vectors.reduce(function addVectors(vecA, vecB) { return vecA.add(vecB); });

    let finalDeltaX = deltaX(finalVector);
    let finalDeltaY = deltaY(finalVector);

    this.isAlive = !pointUtils.willCollide(this.center, finalDeltaX, finalDeltaY, this.game.sources, source => {
        if (this.isManual) return;
        let deadBody = {
            color: source.color,
            center: point(this.originalCenter.x, this.originalCenter.y),
            radius: this.radius
        };
        this.game.deadBodies.push(deadBody);
    });

    if (this.thisAlive && (this.center.x > this.game.size.x || this.center.y > this.game.size.y || this.center.x < 0 || this.center.y < 0)) this.isAlive = false;

    this.center.x += finalDeltaX;
    this.center.y += finalDeltaY;

    this.speed = speed(finalVector);
    this.updatedAt = Date.now();
};

Body.prototype.timeSinceUpdate = function () {
    return Date.now() - presenceTracker.timeOffPage - this.updatedAt;
};

export default Body;