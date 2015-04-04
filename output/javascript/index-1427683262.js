let timeLeft;
let timeOffPage = 0;

document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        timeLeft = Date.now();
    } else {
        timeOffPage += Date.now() - timeLeft;
    }
});

function setColor(screen, color) {
    if (screen.fillStyle !== color) screen.fillStyle = color;
    if (screen.strokeStyle !== color) screen.strokeStyle = color;
}

function drawBody(screen, body) {
    screen.beginPath();
    screen.arc(body.center.x, body.center.y, body.radius, 0, 2 * Math.PI, false);
    screen.fill();
}

function drawVector(screen, fromPoint, toPoint) {
    setColor(screen, "blue");
    screen.beginPath();
    screen.moveTo(fromPoint.x, fromPoint.y);
    screen.lineTo(toPoint.x, toPoint.y);
    screen.stroke();
}

function drawPoint(screen, point, color = "black", size = 1) {
    screen.fillStyle = color;
    screen.beginPath();
    screen.moveTo(point.x, point.y);
    screen.arc(point.x, point.y, size, 0, Math.PI * 2, false);
    screen.fill();
}

function drawLine(screen, pointA, pointB, color = "black") {
    screen.strokeStyle = color;
    screen.beginPath();
    screen.moveTo(pointA.x, pointA.y);
    screen.lineTo(pointB.x, pointB.y);
    screen.stroke();
}

function drawLineF(screen, func, color, loopAll) {
    if (loopAll) {
        for (let x = 0; x < screen.canvas.width; x++) {
            drawPoint(screen, {x, y: func(x)}, color);
        }
    } else {
        drawLine(screen, {x: 0, y: func(0)}, {x: screen.canvas.width, y: func(screen.canvas.width)}, color);
    }
}

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

function getHitPoints(pointA, pointB, center, radius) {
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

function isPointInCircle(point, center, radius) {
    return Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2) <= radius;
}

// Is point C between point A and B, assuming that all points are collinear
function between(pointA, betweenPoint, pointB) {
    let isBetween = (pointA, pointB) => {
        // If X coordinates are equal, then the y coordinate needs to be checked to see if it is in between
        if (pointA.x === pointB.x) {
            return pointA.y <= betweenPoint.y && betweenPoint.y <= pointB.y;
        }

        return pointA.x <= betweenPoint.x && betweenPoint.x <= pointB.x;
    };

    // Checking both pointA and pointB on both sides allows passing them in any order.
    return isBetween(pointA, pointB) || isBetween(pointB, pointA);
}

function willCollide(originalCenter, bodyDeltaX, bodyDeltaY, potentialColliders, callback) {
    let shiftedBodyCenter = {x: originalCenter.x + bodyDeltaX, y: originalCenter.y + bodyDeltaY };

    for (let potentialColliderIdx = 0; potentialColliderIdx < potentialColliders.length; potentialColliderIdx++) {
        let potentialCollider = potentialColliders[potentialColliderIdx];

        // The line containing the segment is intersecting the circle
        if (distanceToLine(originalCenter, shiftedBodyCenter, potentialCollider.center) <= potentialCollider.radius) {
            // Checks if either point is inside the circle
            if (isPointInCircle(originalCenter, potentialCollider.center, potentialCollider.radius) ||
                isPointInCircle(shiftedBodyCenter, potentialCollider.center, potentialCollider.radius)
                ) {

                callback(potentialCollider);

                return true;
            }

            let hitPoints = getHitPoints(originalCenter, shiftedBodyCenter, potentialCollider.center, potentialCollider.radius);

            hitPoints = hitPoints.filter(hitPoint => between(originalCenter, hitPoint, shiftedBodyCenter));

            if (hitPoints.length > 0) {
                callback(potentialCollider);
                return true;
            }
        }
    }
    return false;
}

function randomNum(min, max) {
    return min + Math.random() * (max - min);
}

function Game() {
    let canvas = document.getElementById("canvas");

    canvas.width = document.body.clientWidth - 10;
    canvas.height = document.body.clientHeight - 10;

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');
    this.screen = screen;
    screen.font = "40pt Arial";

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };

    this.deadBodies = [];
    this.bodies = [];
    this.sources = [];
    this.attractors = [];

    this.sources.push(new Source(this, {x: this.size.x / 4, y: this.size.y / 4}));
    this.sources.push(new Source(this, {x: this.size.x / 4 * 3, y: this.size.y / 4}));
    this.sources.push(new Source(this, {x: this.size.x / 4, y: this.size.y / 4 * 3}));
    this.sources.push(new Source(this, {x: this.size.x / 4 * 3, y: this.size.y / 4 * 3}));

    let intervalId, timeoutId;

    let spawnBody = (clientX, clientY, isManual) => {
        let bodyCenter = {
            x: clientX,
            y: clientY
        };
        this.addBody(new Body(this, bodyCenter, isManual));
    };

    let spawnRandomBody = () => {
        let bodyCenter = {
            x: randomNum(0, this.size.x),
            y: randomNum(0, this.size.y)
        };
        this.addBody(new Body(this, bodyCenter));
    };

    global.spawnBodies = true;

    for (let x = 0; x < this.size.x; x++) {
        for (let y = 0; y < this.size.y; y++) {
            setTimeout(() => spawnBody(x, y, false), 0);
        }
    }

    // let bodySpawner = () => {
    //     if (global.spawnBodies) spawnRandomBody();
    // };

    // setInterval(bodySpawner, 0);
    // setInterval(bodySpawner, 0);
    // setInterval(bodySpawner, 0);

    canvas.addEventListener("click", ({clientY, clientX}) => {
        if (!this.sources[0]) return true;
        spawnBody(clientX, clientY, true);
    });

    let tick = () => {
        // screen.clearRect(0, 0, this.size.x, this.size.y); //allows this.update() to draw vectors
        this.update();
        this.draw(screen);

        requestAnimationFrame(tick);
        // setTimeout(tick, 500);
    };

    this.tick = tick;

    requestAnimationFrame(tick);
}

Game.prototype.update = function() {
    this.sources.forEach(source => source.update());

    this.bodies = this.bodies.filter(function cleanDeadBodies(body) {
        return body.isAlive;
    });

    this.bodies.forEach(body => body.update());
};

Game.prototype.draw = function() {
    let screen = this.screen;

    setColor(screen, "black");
    this.bodies.filter(body => body.isManual).forEach(body => drawBody(screen, body));
    this.deadBodies.forEach(deadBody => {
        setColor(this.screen, deadBody.color);
        drawBody(this.screen, deadBody);
    });

    this.sources.forEach(source => {
        setColor(screen, source.color);
        drawBody(screen, source);
        setColor(screen, "black");
        screen.beginPath();
        screen.arc(source.center.x, source.center.y, source.radius, 0, 2 * Math.PI, false);
        screen.stroke();
    });

    setColor(screen, "red");
    this.attractors.forEach(attractor => drawBody(screen, attractor));

    setColor(screen, "black");
    screen.fillText("Bodies: " + this.bodies.length, 5, this.size.y - 5);
};
Game.prototype.addBody = function(body) {
    this.bodies.push(body);
};


let colors = [];
for (let i = 0; i < 4; i++) {
    let num = 360 / 4 * i;
    colors.push(`hsl(${num}, 100%, 50%)`);
}
let masses = [];
for (let i = 0; i < 4; i++) {
    masses.push(25 - 6 * i);
}
function Source(game, center) {
    this.game = game;
    this.center = center;
    this.color = colors.shift(); //'#' + Math.floor(Math.random() * 16777215).toString(16);

    let coefficient = Math.pow(10, 1);
    let random = masses.shift(); /*Math.random() * 10*/
    this.G = 1.1 * random / coefficient;

    this.radius = 1.1 * random * 3 + 10;
    this.added = !false;
}

Source.prototype.update = function () {
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
};

function Vector(length, direction) {
    this.length = length;
    this.direction = direction;
}

Vector.prototype.getDeltaX = function () {
    return this.length * Math.cos(this.direction);
};

Vector.prototype.getDeltaY = function () {
    return this.length * Math.sin(this.direction);
};

Vector.prototype.add = function (vector) {
    let totalDeltaX = this.getDeltaX() + vector.getDeltaX();
    let totalDeltaY = this.getDeltaY() + vector.getDeltaY();

    let force = Math.sqrt(
        Math.pow(totalDeltaX, 2) +
        Math.pow(totalDeltaY, 2)
    );

    let direction = Math.atan2(totalDeltaY, totalDeltaX);

    return new Vector(force, direction);
};

function Body(game, center, isManual) {
    this.isManual = isManual;
    this.originalCenter = { x: center.x, y: center.y };

    this.game = game;
    this.center = center;

    this.isAlive = true;
    this.creationTime = Date.now();
    this.updatedAt = Date.now();

    this.G = Math.random();
    this.radius = 3 * this.G;
    this.speed = Math.random() / 10;
}

Body.prototype.update = function() {
    let timeSinceUpdate = this.timeSinceUpdate();

    let acceleration = (vector) => vector.length / this.G;

    let speed        = (vector) => this.speed + (acceleration(vector) * timeSinceUpdate);
    let distance     = (vector) => speed(vector) * timeSinceUpdate;
    let deltaX       = (vector) => distance(vector) * Math.cos(vector.direction);
    let deltaY       = (vector) => distance(vector) * Math.sin(vector.direction);

    let drawVec = vec => {
        vec = new Vector(vec.length * Math.pow(10, 6), vec.direction);
        drawVector(this.game.screen, this.center, {
            x: this.center.x + vec.getDeltaX(),
            y: this.center.y + vec.getDeltaY()
        });
    };

    let vectors = this.game.sources.map(source => {
        let force = this.G * source.G / Math.pow(distanceBetween(this.center, source.center), 2);

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
    // vectors.forEach(vec => drawVec(vec));
    // drawVec(finalVector);

    this.isAlive = !willCollide(this.center, finalDeltaX, finalDeltaY, this.game.sources, source => {
        let deadBody = { color: source.color, center: { x: this.originalCenter.x, y: this.originalCenter.y }, radius: this.radius };
        setColor(this.game.screen, deadBody.color);
        drawBody(this.game.screen, deadBody);
    });

    if (this.thisAlive && (this.center.x > this.game.size.x || this.center.y > this.game.size.y || this.center.x < 0 || this.center.y < 0)) this.isAlive = false;

    this.center.x += finalDeltaX;
    this.center.y += finalDeltaY;

    this.speed = speed(finalVector);
    this.updatedAt = Date.now();
};

Body.prototype.timeSinceUpdate = function () {
    return Date.now() - timeOffPage - this.updatedAt;
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });