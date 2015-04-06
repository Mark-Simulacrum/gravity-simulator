function setColor(screen, color) {
    if (screen.fillStyle !== color) screen.fillStyle = color;
    if (screen.strokeStyle !== color) screen.strokeStyle = color;
}

function drawBody(screen, body) {
    screen.beginPath();
    screen.arc(body.center.x, body.center.y, body.radius, 0, 2 * Math.PI, false);
    screen.fill();
}

function drawVector(screen, vector, toPoint) {
    setColor(screen, "blue");
    screen.beginPath();
    screen.moveTo(vector.fromPoint.x, vector.fromPoint.y);
    screen.lineTo(toPoint.x, toPoint.y);
    screen.stroke();
}

// function drawPoint(screen, point, color = "black", size = 1) {
//     screen.fillStyle = color;
//     screen.beginPath();
//     screen.moveTo(point.x, point.y);
//     screen.arc(point.x, point.y, size, 0, Math.PI * 2, false);
//     screen.fill();
// }

// function drawLine(screen, pointA, pointB, color = "black") {
//     screen.strokeStyle = color;
//     screen.beginPath();
//     screen.moveTo(pointA.x, pointA.y);
//     screen.lineTo(pointB.x, pointB.y);
//     screen.stroke();
// }

// function drawLineF(screen, func, color, loopAll) {
//     if (loopAll) {
//         for (let x = 0; x < screen.canvas.width; x++) {
//             drawPoint(screen, {x, y: func(x)}, color);
//         }
//     } else {
//         drawLine(screen, {x: 0, y: func(0)}, {x: screen.canvas.width, y: func(screen.canvas.width)}, color);
//     }
// }

function distanceBetween(pointA, pointB) {
    return Math.sqrt(
            Math.pow(pointA.x - pointB.x, 2) +
            Math.pow(pointA.y - pointB.y, 2)
        );
}

/*
 * pA - P1, pB - P2, pC - distance to this point
 * pA and pB define the line
 */
function distanceToLine(pA, pB, pC) {
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

function getSlope(pointA, pointB) {
    // Check for a vertical line, return undefined.
    return pointA.x === pointB.x ? undefined : (pointA.y - pointB.y) / (pointA.x - pointB.x);
}

function getYIntercept(pointA, pointB) {
    return pointA.y - getSlope(pointA, pointB) * pointA.x;
}

function lineEquation(slope, yIntercept) {
    return x => slope * x + yIntercept;
}

function getHitPoints(pointA, pointB, center, radius/*, screen*/) {
    let hitPoints = [];

    let m = getSlope(pointA, pointB);
    let h = center.x; // x coord of circle's center
    let k = center.y; // y coord of circle's center
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

        if (discriminant < 0) return [];

        let getY = lineEquation(m, b);
        let getPoint = x => { return { x, y: getY(x) }; };

        // console.log(-B - Math.sqrt(discriminant) / (2 * A), getY(-B - Math.sqrt(discriminant) / (2 * A)));

        hitPoints.push(getPoint((-B - Math.sqrt(discriminant)) / (2 * A)));
        hitPoints.push(getPoint((-B + Math.sqrt(discriminant)) / (2 * A)));

        // drawLineF(screen, getY, "rgba(0, 0, 0, 0.1)", false);
    }

    // hitPoints.forEach(point => drawPoint(screen, point, "red", 3));

    return hitPoints;
}

function isPointInCircle(point, center, radius) {
    return Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2) <= radius;
}

// Is point C between point A and B, assuming that all points are collinear
function between(pointA, betweenPoint, pointB) {
    let isBetween = (pointA, pointB) => {
        // y coordinate only needs checking if both x coordinates are the same.
        let xBetween = pointA.x <= betweenPoint.x && betweenPoint.x <= pointB.x;
        if (xBetween && pointA.x === pointB.x) {
            return pointA.y <= betweenPoint.y && betweenPoint.y <= pointB.y;
        }

        return xBetween;
    };

    // Checking both pointA and pointB on both sides allows passing them in any order.
    return isBetween(pointA, pointB) || isBetween(pointB, pointA);
}

function willCollide(body, bodyDeltaX, bodyDeltaY, potentialColliders) {
    let shiftedBodyCenter = {x: body.center.x + bodyDeltaX, y: body.center.y + bodyDeltaY };

    for (let potentialColliderIdx = 0; potentialColliderIdx < potentialColliders.length; potentialColliderIdx++) {
        let potentialCollider = potentialColliders[potentialColliderIdx];

        // The line containing the segment is intersecting the circle
        if (distanceToLine(body.center, shiftedBodyCenter, potentialCollider.center) <= potentialCollider.radius) {
            // Checks if either point is inside the circle
            if (isPointInCircle(body.center, potentialCollider.center, potentialCollider.radius) ||
                isPointInCircle(shiftedBodyCenter, potentialCollider.center, potentialCollider.radius)) return true;

            let hitPoints = getHitPoints(body.center, shiftedBodyCenter, potentialCollider.center, potentialCollider.radius, body.game.screen);

            hitPoints = hitPoints.filter(hitPoint => between(body.center, hitPoint, shiftedBodyCenter));

            if (hitPoints.length > 0) return true;
        }
    }
    return false;
}

function Game() {
    let canvas = document.getElementById("canvas");

    canvas.width = document.body.clientWidth - 10;
    canvas.height = document.body.clientHeight - 10;

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');
    this.screen = screen;

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };

    this.bodies = [];
    this.sources = [];
    this.attractors = [];

    this.sources.push(new Source(this, {x: this.size.x / 4, y: this.size.y / 4}));
    this.sources.push(new Source(this, {x: this.size.x / 4 * 3, y: this.size.y / 4}));
    this.sources.push(new Source(this, {x: this.size.x / 4, y: this.size.y / 4 * 3}));
    this.sources.push(new Source(this, {x: this.size.x / 4 * 3, y: this.size.y / 4 * 3}));

    let intervalId, timeoutId;

    let randomGet = (startPoint) => {
        let sign = Math.random() > 0.5 ? +1 : -1;

        return startPoint + Math.random() * sign * 500;
    };

    let spawnBody = (random, clientX, clientY) => {
        let bodyCenter = {x: random ? randomGet(clientX) : clientX, y: random ? randomGet(clientY) : clientY};
        this.addBody(new Body(this, bodyCenter));
    };

    setInterval(spawnBody.bind(null, true, this.size.x / 2, this.size.y / 2), 100);

    canvas.addEventListener("mousedown", ({clientY, clientX}) => {
        if (!this.sources[0]) return true;
        spawnBody(false, clientX, clientY);
    });

    let clearCallbacks = () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
    };

    canvas.addEventListener("mouseup", clearCallbacks);
    canvas.addEventListener("mouseout", clearCallbacks);

    let tick = () => {
        screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
        this.update();
        this.draw(screen);

        requestAnimationFrame(tick);
        // setTimeout(tick, 500);
    };

    this.tick = tick;

    requestAnimationFrame(tick);
}

Game.prototype = {
    update() {
        this.sources.forEach(source => source.update());

        this.bodies = this.bodies.filter(body => body.isAlive);

        this.bodies.forEach(body => body.update());
    },
    draw(screen) {
        setColor(screen, "black");
        screen.fillText("Bodies: " + this.bodies.length, 5, this.size.y - 5);

        setColor(screen, "black");
        this.bodies.forEach(body => drawBody(screen, body));

        setColor(screen, "green");
        this.sources.forEach(source => drawBody(screen, source));

        setColor(screen, "red");
        this.attractors.forEach(attractor => drawBody(screen, attractor));
    },
    addBody(body) {
        this.bodies.push(body);
    },
    isBodyOnScreen(body) {
        return body.center.x - body.size.x / 2 > 0
            && body.center.y - body.size.y / 2 > 0
            && body.center.x + body.size.x / 2 < this.size.x
            && body.center.y + body.size.y / 2 < this.size.y;
    }
};

function Source(game, center) {
    this.game = game;
    this.center = center;
    let coefficient = Math.pow(10, 5);
    this.G = 1.1 / coefficient;
    this.radius = 16;
    this.added = !false;
}

Source.prototype = {
    update() {
        if (this.added) return;
        this.added = true;
        let bound = 20;
        for (let x = -bound; x < bound; x++) {
            for (let y = -bound; y < bound; y++) {
                let body = new Body(this.game, {x: this.center.x + x, y: this.center.y + y});
                body.update();
                this.game.addBody(body);
            }
        }
    }
};

let vectorIncrement = 0;
function Vector(x, y, length, direction) {
    this.id = vectorIncrement++;
    this.fromPoint = { x, y };
    this.length = length;
    this.direction = direction;
}

let bodyIncrement = 0;
function Body(game, center) {
    this.game = game;
    this.center = center;

    this.id = bodyIncrement++;

    this.isAlive = true;
    this.creationTime = Date.now();
    this.updatedAt = Date.now();

    this.radius = 1;
    this.bodyMass = 1;
    this.speed = 0;
}

Body.prototype = {
    update() {
        let timeSinceUpdate = this.timeSinceUpdate();

        let acceleration = (vector) => vector.length / this.bodyMass;
        let speed        = (vector) => this.speed + (acceleration(vector) * timeSinceUpdate);
        let distance     = (vector) => speed(vector) * timeSinceUpdate;
        let deltaX       = (vector) => distance(vector) * Math.cos(vector.direction);
        let deltaY       = (vector) => distance(vector) * Math.sin(vector.direction);

        let drawVec = vec => {
            vec = new Vector(vec.fromPoint.x, vec.fromPoint.y, vec.length * Math.pow(10, 4), vec.direction);
            drawVector(this.game.screen, vec, {
                x: vec.fromPoint.x + deltaX(vec),
                y: vec.fromPoint.y + deltaY(vec)
            });
        };

        let vectors = this.game.sources.map(source => {
            let force = this.bodyMass * source.G;

            return new Vector(
                this.center.x,
                this.center.y,
                force,
                Math.atan2(
                    this.center.y - source.center.y,
                    this.center.x - source.center.x
                ) + Math.PI
            );
        });

        let finalVector = vectors.reduce((vecA, vecB) => {
            let totalDeltaX = vecA.length * Math.cos(vecA.direction) + vecB.length * Math.cos(vecB.direction);
            let totalDeltaY = vecA.length * Math.sin(vecA.direction) + vecB.length * Math.sin(vecB.direction);

            // hypotenuse of the triangle:
            // square root(
            //   (change in x)^2 + (change in y)^2
            // )
            let force = Math.sqrt(
                Math.pow(totalDeltaX, 2) +
                Math.pow(totalDeltaY, 2)
            );

            let direction = Math.atan2(totalDeltaY, totalDeltaX);

            // console.log("V(d,l)",
            //     [vecA.direction, vecA.length], "+",
            //     [vecB.direction, vecB.length], "=",
            //     [direction, force]
            // );

            // console.log('fd', force, direction * (180 / Math.PI));

            return new Vector(
                this.center.x,
                this.center.y,
                force,
                direction
            );
        });

        // finalVector = vectors[0];

        let finalDeltaX = deltaX(finalVector);
        let finalDeltaY = deltaY(finalVector);
        // vectors.forEach(vec => drawVec(vec));
        // drawVec(finalVector);

        // console.log(finalVector.length);
        // console.log('dX,dY', finalDeltaX, finalDeltaY);

        this.isAlive = !willCollide(this, finalDeltaX, finalDeltaY, this.game.sources);

        if (this.center.x > this.game.size.x || this.center.y > this.game.size.y || this.center.x < 0 || this.center.y < 0) this.isAlive = false;

        this.center.x += finalDeltaX;
        this.center.y += finalDeltaY;

        // console.log(this.center.x, this.center.y, finalDeltaX, finalDeltaY);

        this.speed = speed(finalVector);
        this.updatedAt = Date.now();
    },
    timeSinceUpdate() {
        return Date.now() - this.updatedAt;
    },
    timeExisted() {
        return Date.now() - this.creationTime;
    }
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });