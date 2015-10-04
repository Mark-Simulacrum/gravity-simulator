import * as constants from "./constants";
import * as pointUtils from "./pointUtils";
import Vector from "./Vector";

function acceleration(force, mass) {
    return force.length / mass;
}

function speedNow(speed0, force, mass, elapsedTime) {
    return speed0 + acceleration(force, mass) * elapsedTime;
}

function distanceTravelled(speed, elapsedTime) {
    return speed * elapsedTime;
}

function shift(speed0, force, mass, elapsedTime) {
    return {
        x: distanceTravelled(speedNow(speed0, force, mass, elapsedTime), elapsedTime) * Math.cos(force.direction),
        y: distanceTravelled(speedNow(speed0, force, mass, elapsedTime), elapsedTime) * Math.sin(force.direction)
    };
}

export function moveObject(object, elapsedTime, affectingObjects) {
    let vectors = affectingObjects.map(affectingObject => {
        if (affectingObject === object) {
            return new Vector(0, 0, "N");
        }

        let force = constants.G *
            object.mass * affectingObject.mass / Math.pow(pointUtils.distanceBetween(object.center, affectingObject.center), 2);

        let vector = new Vector(
            force,
            Math.atan2(
                object.center.y - affectingObject.center.y,
                object.center.x - affectingObject.center.x
            ) + Math.PI,
            "N"
        );

        if (affectingObject.type === "deflector") {
            vector = vector.opposite();
        }

        return vector;
    });

    let planetsVector = vectors.length > 0 ? vectors.reduce((vecA, vecB) => vecA.add(vecB)) : new Vector(0, 0, "N");
    let projectedVectors = planetsVector.projectionOnto(object.speed);

    let delta = {
        a: shift(object.speed.length, projectedVectors.a, object.mass, elapsedTime),
        b: shift(0, projectedVectors.b, object.mass, elapsedTime)
    };

    delta.x = delta.a.x + delta.b.x;
    delta.y = delta.a.y + delta.b.y;

    let previousSpeed = object.speed.length;
    object.speed = new Vector(
        pointUtils.distanceBetween({ x: 0, y: 0 }, delta) / elapsedTime,
        Math.atan2(
            delta.y,
            delta.x
        ),
        "m/s"
    );

    object.center.x += delta.x;
    object.center.y += delta.y;

    return {
        acceleration: object.speed.length - previousSpeed,
        delta: { x: delta.x, y: delta.y }
    };
}
