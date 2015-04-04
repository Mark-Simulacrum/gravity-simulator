function drawRect(screen, body) {
    if (body instanceof Source) {
        screen.fillStyle = "green";
    } else if (body instanceof Attractor) {
        screen.fillStyle = "red";
    } else {
        screen.fillStyle = "black";
    }

    screen.fillRect(body.center.x - body.size.x / 2,
        body.center.y - body.size.y / 2,
        body.size.x, body.size.y);
}

function colliding(body1, body2) {
    return !(
        body1 === body2 ||
        body1.center.x + body1.size.x / 2 < body2.center.x - body2.size.x / 2 ||
        body1.center.y + body1.size.y / 2 < body2.center.y - body2.size.y / 2 ||
        body1.center.x - body1.size.x / 2 > body2.center.x + body2.size.x / 2 ||
        body1.center.y - body1.size.y / 2 > body2.center.y + body2.size.y / 2
    );
}

function getDirection(fromPoint, toPoint) {
    let dir;
    if (fromPoint.x === toPoint.x) {
        dir = Math.PI / 2 * (fromPoint.y - toPoint.y < 0 ? 1 : -1);
    } else {
        dir = Math.atan(
            (toPoint.y - fromPoint.y) /
            (toPoint.x - fromPoint.x)
        );
    }

    return fromPoint.x > toPoint.x ? dir + Math.PI : dir;
}

function maxRand(num) {
    return Math.random() * num;
}

function Game() {
    let canvas = document.getElementById("canvas");

    canvas.width = document.querySelector("html").clientWidth - 20;
    canvas.height = document.querySelector("html").clientHeight - 20;

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };

    this.bodies = [];
    this.sources = [];
    this.attractors = [];

    this.sources.push(new Source(this, {x: this.size.x / 4, y: this.size.y / 4}));
    this.sources.push(new Source(this, {x: this.size.x / 4 * 3, y: this.size.y / 4}));
    // this.sources.push(new Source(this, {x: this.size.x / 4, y: this.size.y / 4 * 3}));
    // this.sources.push(new Source(this, {x: this.size.x / 4 * 3, y: this.size.y / 4 * 3}));

    // canvas.addEventListener("click", e => {
    //     this.sources.push(new Source(this, {x: e.x, y: e.y}));
    // });

    canvas.addEventListener("click", e => {
        if (!this.sources[0]) return true;

        let bodyCenter = {x: e.clientX, y: e.clientY};

        let body = new Body(this, bodyCenter);
        body.update();
        this.addBody(body);
    });

    // let cleanUpTick = () => {
    //     this.bodies = this.bodies.filter(body => {
    //         return !(body instanceof Body && body.timeExisted() > 1000 * 30); // Bodies last only 30 seconds.
    //     });
    // };

    // let accelerateOldBodies = () => {
    //     this.bodies.forEach(body => {
    //         body.timeExisted(G);
    //         // body.updateVelocity({x: G * body.timeExisted(), y: G * body.timeExisted()});
    //     });
    // };

    let timesTicked = 0;
    let tick = () => {
        ++timesTicked;
        // requestAnimationFrame(accelerateOldBodies);

        this.update();
        this.draw(screen);

        /*if (timesTicked < 10)*/ requestAnimationFrame(tick);
    };

    this.tick = tick;

    requestAnimationFrame(tick);
}

Game.prototype = {
    update() {
        this.bodies = this.bodies.filter(body => this.isBodyOnScreen(body));

        this.sources.forEach(source => source.update());

        this.bodies = this.bodies.filter(body => {
            return !colliding(this.sources[0], body);
        });

        this.bodies.forEach(body => {
            body.update();
        });
    },
    draw(screen) {
        screen.clearRect(0, 0, this.size.x, this.size.y);

        [].concat(this.bodies, this.sources, this.attractors).forEach((body) => {
            drawRect(screen, body);
        });
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
    let coefficient = 5;
    this.G = 1.1 / coefficient;
    this.size = { x: 16 * this.G * coefficient, y: 16 * this.G * coefficient };
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

function Attractor(game, center) {
    this.game = game;
    this.center = center;
    this.size = {x: 3, y: 3};
}

Attractor.prototype = {
    update() {
        this.game.bodies.forEach(body => {
            let center = body.center;

            let distance = {x: this.center.x - center.x, y: this.center.y - center.y};

            body.updateVelocity({
                x: body.velocity.x + (distance.x / body.timeSinceVelocityChange()),
                y: body.velocity.y + (distance.y / body.timeSinceVelocityChange())
            });
        });
    }
};


// function average(...nums) {
//     return nums.reduce((a, b) => a + b) / nums.length;
// }

function Vector(x, y, length, direction) { // mag is velocity
    this.fromPoint = { x, y };

    this.toPoint = {
        x: x + length * Math.cos(direction),
        y: y + length * Math.sin(direction)
    };
    this.direction = direction;
    this.length = length;
}

Vector.prototype.getChangeX = function(timeSince) {
    console.log("len", this.length);
    let distanceChanged = this.length * timeSince;
    return distanceChanged * this.length * Math.cos(this.direction);
};

Vector.prototype.getChangeY = function(timeSince) {
    let distanceChanged = this.length * timeSince;
    return distanceChanged * this.length * Math.sin(this.direction);
};

function Body(game, center) {
    this.creationTime = Date.now();
    this.updatedAt = Date.now();
    this.game = game;
    this.center = center;
    this.size = { x: 4, y: 4 };
    // this.direction = getDirection(this.game.sources[0], this);
}

Body.prototype = {
    update() {
        let bodyMass = 1;

        let vectors = this.game.sources.map(source => {
            let force = bodyMass * source.G;

            let vec = new Vector(
                this.center.x,
                this.center.y,
                force,
                getDirection(this.center, source.center)
            );

            return vec;
        });

        let hypotenuse = (pointA, pointB) => {
            return Math.sqrt(
                Math.pow(pointA.x + pointB.x, 2) + Math.pow(pointA.y + pointB.y, 2)
            );
        };

        let finalVector = vectors.reduce((vectorA, vectorB) => {
            return new Vector(
                vectorA.fromPoint.x,
                vectorA.fromPoint.y,
                hypotenuse(vectorA.fromPoint, vectorB.toPoint),
                getDirection(vectorA.fromPoint, vectorB.toPoint)
            );
        });

        console.log(finalVector.getChangeX(this.timeSinceUpdate()));

        this.center.x += finalVector.getChangeX(this.timeSinceUpdate());
        this.center.y += finalVector.getChangeY(this.timeSinceUpdate());

        this.updatedAt = Date.now();
    },
    timeSinceUpdate() {
        return Date.now() - this.updatedAt;
    },
    timeExisted() {
        return Date.now() - this.creationTime;
    },
    timeSinceVelocityChange() {
        return Date.now() - this.velocityChanged;
    }
};

window.addEventListener("DOMContentLoaded", () => { global.game = new Game(); });
