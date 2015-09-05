import * as constants from "./constants";

export function toReal(point) {
    return { x: constants.toReal(point.x), y: constants.toReal(point.y) };
}

export function fromReal(point) {
    return { x: constants.fromReal(point.x), y: constants.fromReal(point.y) };
}

export function midpoint(pointA, pointB) {
    return { x: (pointA.x + pointB.x) / 2, y: (pointA.y + pointB.y) / 2 };
}

export function distanceBetween(pointA, pointB) {
    return Math.sqrt(
            Math.pow(pointA.x - pointB.x, 2) +
            Math.pow(pointA.y - pointB.y, 2)
        );
}

/*
 * pA - P1, pB - P2, pC - distance to this point
 * pA and pB define the line
 */
export function distanceToLine(pA, pB, pC) {
    // Absolute value is twice the area of a triangle as defined by three coordinates in a
    // cartesian coordinate system. (http://en.wikipedia.org/wiki/Triangle#Using_coordinates)
    // The absolute value is then divided by the distance between the two points (pA and pB),
    // giving the height of the triangle, which is the shortest distance between the line and the point.
    // Documentation: http://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
    return Math.abs(
            (pB.y - pA.y) * pC.x -
            (pB.x - pA.x) * pC.y +
            pB.x * pA.y -
            pB.y * pA.x
         ) / distanceBetween(pA, pB);
}

export function getSlope(pointA, pointB) {
    // Check for a vertical line, return undefined.
    return pointA.x === pointB.x ? undefined : (pointA.y - pointB.y) / (pointA.x - pointB.x);
}

export function getYIntercept(pointA, pointB) {
    return pointA.y - getSlope(pointA, pointB) * pointA.x;
}

export function lineEquation(slope, yIntercept) {
    return x => slope * x + yIntercept;
}

export function getHitPoints(pointA, pointB, center, radius) {
    let hitPoints = [];

    let m = getSlope(pointA, pointB);
    let h = center.x; // x coordinate of circle's center
    let k = center.y; // y coordinate of circle's center
    let r = radius; // radius of circle's center

    if (m === undefined) {
        let C = pointA.x;

        hitPoints.push({x: C, y: +Math.sqrt(r * r - Math.pow(C - h, 2)) + k });
        hitPoints.push({x: C, y: -Math.sqrt(r * r - Math.pow(C - h, 2)) + k });
    } else {
        let b = getYIntercept(pointA, pointB);

        let A = 1 + m * m;
        let B = -2 * h + 2 * m * b - 2 * k * m;
        let C = -(2 * k * b - k * k + r * r - h * h - b * b);

        let discriminant = B * B - 4 * A * C;

        if (discriminant > 0) {
            let getY = lineEquation(m, b);
            let getPoint = x => { return { x, y: getY(x) }; };

            hitPoints.push(getPoint((-B - Math.sqrt(discriminant)) / (2 * A)));
            hitPoints.push(getPoint((-B + Math.sqrt(discriminant)) / (2 * A)));
        }
    }

    return hitPoints;
}

export function isPointInCircle(point, center, radius) {
    return distanceBetween(point, center) <= radius;
}

// Is point C between point A and B, assuming that all points are collinear
export function isBetween(pointA, betweenPoint, pointB) {
    let _isBetween = (pointA, pointB) => {
        // If X coordinates are equal, then the y coordinate needs to be checked to see if it is in between
        if (pointA.x === pointB.x) {
            return pointA.y <= betweenPoint.y && betweenPoint.y <= pointB.y;
        }

        return pointA.x <= betweenPoint.x && betweenPoint.x <= pointB.x;
    };

    // Checking both pointA and pointB on both sides allows passing them in any order.
    return _isBetween(pointA, pointB) || _isBetween(pointB, pointA);
}

export function willCollide(originalCenter, bodyDelta, potentialColliders, callback) {
    let shiftedBodyCenter = {
        x: originalCenter.x + bodyDelta.x,
        y: originalCenter.y + bodyDelta.y
    };

    return potentialColliders.some(potentialCollider => {
        // The line containing the segment is intersecting the circle
        if (distanceToLine(originalCenter, shiftedBodyCenter, potentialCollider.center) <= potentialCollider.radius) {
            if (isPointInCircle(originalCenter, potentialCollider.center, potentialCollider.radius) ||
                isPointInCircle(shiftedBodyCenter, potentialCollider.center, potentialCollider.radius)) {

                if (callback) callback(potentialCollider);

                return true;
            }

            let hitPoints = getHitPoints(originalCenter, shiftedBodyCenter, potentialCollider.center, potentialCollider.radius);

            let result = hitPoints.some(hitPoint => isBetween(originalCenter, hitPoint, shiftedBodyCenter));

            if (result && callback) callback(potentialCollider);

            return result;
        }
    });
}










