/*
 * pA and pB define the line containing the segment
 * http://math.stackexchange.com/questions/322831/determing-the-distance-from-a-line-segment-to-a-point-in-3-space
 * http://math.stackexchange.com/questions/2837/how-to-tell-if-a-line-segment-intersects-with-a-circle
 */
function distanceToSegment(pA, pB, pC) {
    let lineDistance = distanceToLine(pA, pB, pC);
    let AC = distanceBetween(pA, pC);
    let BC = distanceBetween(pB, pC);
    console.log('d,AC,BC', lineDistance, AC, BC);

    if (AC < BC) return AC;
    if (BC < AC) return BC;
    return lineDistance;
}

function isSegmentIntersectingCircle(pointA, pointB, center, radius) {
    // The segment is contained completely within the circle or a chord of the circle
    if (distanceBetween(pointA, center) <= radius && distanceBetween(pointB, center) <= radius) {
        return true;
    }

    let m = (pointA.y - pointB.y) / (pointA.x - pointB.x); // slope
    let b = pointA.y - m * pointA.x; // y-intercept
    let h = center.x; // x coord of circle's center
    let k = center.y; // y coord of circle's center
    let r = radius; // radius of circle's center

    let discriminant = Math.pow(2 * m * b + -2 * h + -2 * k * m, 2) - 4 * (1 + m * m) * (k * k - r * r + -2 * k * b); // b^2 - 4ac

    console.log(radius, distanceBetween(pointA, center), distanceBetween(pointB, center), discriminant);
    if (discriminant >= 0) return true; // segment intersects at the circle at one or two points.
}


    // if (m === undefined) { // Vertical line
    //     return [];
    // //     let C = pointA.x;
    // //     hitPoints.push({x: C, y: +Math.sqrt(r * r - Math.pow(C - h, 2)) + k });
    // //     hitPoints.push({x: C, y: -Math.sqrt(r * r - Math.pow(C - h, 2)) + k });

    // //     console.log(0, hitPoints[0].x, hitPoints[0].y);
    // //     console.log(1, hitPoints[1].x, hitPoints[1].y);
    // } else {