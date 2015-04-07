import Vector from "./Vector.js";
import presenceTracker from "./presenceTracker";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";

let initNum = 0;
function Body(game, center, isManual, options = {}) {
    this.game = game;
    this.center = center;
    this.isManual = isManual;

    this.isAlive = true;
    this.type = "body";
    this.id = initNum;
    this.originalCenter = { x: center.x, y: center.y };

    this.mass = constants.EarthMass / 2;
    this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

    let injectionVector = options.initialSpeed !== undefined ? options.initialSpeed : new Vector(
        5500,
        0,
        "m/s"
    );

    this.startSpeed = injectionVector.length;
    this.speed = injectionVector;
    this.timeSinceUpdate = 0;

    initNum++;
}

Body.prototype.acceleration = function (force) {
    return force.length / this.mass;
};

Body.prototype.speedNow = function (speed0, force) {
    return speed0 + this.acceleration(force) * this.timeSinceUpdate;
};

Body.prototype.distanceTravelled = function (speed) {
    return speed * this.timeSinceUpdate;
};

Body.prototype.shift = function (speed0, force) {
    return {
        x: this.distanceTravelled(this.speedNow(speed0, force)) * Math.cos(force.direction),
        y: this.distanceTravelled(this.speedNow(speed0, force)) * Math.sin(force.direction)
    };
};

Body.prototype.update = function(timeSinceUpdate) {
    this.timeSinceUpdate = timeSinceUpdate;

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
    let projectedVectors = planetsVector.projectionOnto(this.speed);

    let delta = {
        a: this.shift(this.speed.length, projectedVectors.a),
        b: this.shift(0, projectedVectors.b)
    };

    delta.x = delta.a.x + delta.b.x;
    delta.y = delta.a.y + delta.b.y;

    let previousSpeed = this.speed.length;
    this.speed = new Vector(
        pointUtils.distanceBetween({ x: 0, y: 0 }, delta) / timeSinceUpdate,
        Math.atan2(
            delta.y,
            delta.x
        ),
        "m/s"
    );

    let currentAcceleration = this.speed.length - previousSpeed;
    let min = 255;
    let max = 360;
    let hue = Math.min(currentAcceleration / max, 1) * (max - min) + min;
    this.color = `hsl(${hue}, 100%, 70%)`;

    this.isAlive = !pointUtils.willCollide(this.center, delta, this.game.attractors);

    this.center.x += delta.x;
    this.center.y += delta.y;
};

export default Body;