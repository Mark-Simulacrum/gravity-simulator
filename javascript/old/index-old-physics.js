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

function Game() {
    let canvas = document.getElementById("canvas");

    canvas.width = document.querySelector("html").clientWidth - 20;
    canvas.height = document.querySelector("html").clientHeight - 20;

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.size = { x: canvas.width, y: canvas.height };

    // Create the bodies array to hold the player, invaders and bullets.
    this.bodies = [];

    canvas.addEventListener("click", e => {
        if (e.button === 0) {
            this.addBody(new Source(this, {x: e.x, y: e.y}));
        } else if (e.button === 1) {
            this.addBody(new Attractor(this, {x: e.x, y: e.y}));
        }
        e.preventDefault();
    });

    let cleanUpTick = () => {
        let now = Date.now();
        this.bodies = this.bodies.filter(body => {
            return !(body instanceof Bullet && now - body.creationTime > 1000 * 10); // Bullets last only 10 seconds.
        });
    };

    let accelerateOldBodies = () => {
        let now = Date.now();
        this.bodies.forEach(body => {
            if (body.velocity && ((now - body.creationTime) % 1000) === 0) {
                body.velocity.x *= 1.1;
                body.velocity.y *= 1.1;
            }
        });
    };

    let tickCount = 0;
    let tick = () => {
        tickCount++;

        if (tickCount > 60) { // 100 frames
            tickCount = 0;
            requestAnimationFrame(accelerateOldBodies);
            requestAnimationFrame(cleanUpTick);
        }

        this.update();
        this.draw(screen);

        requestAnimationFrame(tick);
    };


    requestAnimationFrame(tick);
}

Game.prototype = {
    update() {
        this.bodies = this.bodies.filter(body => this.isBodyOnScreen(body));

        this.bodies.forEach((body) => {
            body.update();
        });
    },
    draw(screen) {
        screen.clearRect(0, 0, this.size.x, this.size.y);

        this.bodies.forEach((body) => {
            drawRect(screen, body);
        });
    },
    addBody(body) {
        body.creationTime = Date.now();
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
    this.size = { x: 3, y: 3 };
}

Source.prototype = {
    randomVelocity() {
        let negative = () => { return Math.random() > 0.5 ? 1 : -1; };
        return {
            x: Math.random() * negative(),
            y: Math.random() * negative()
        };
    },
    update() {
        this.game.addBody(new Bullet({x: this.center.x, y: this.center.y}, this.randomVelocity()));
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
            if (!body.velocity) return;
            let center = body.center;

            let distance = {x: this.center.x - center.x, y: this.center.y - center.y};

            body.velocity = {
                x: body.velocity.x + (distance.x / 100),
                y: body.velocity.y + (distance.y / 100)
            };
        });
    }
};

function Bullet(center, velocity) {
    this.center = center;
    this.size = { x: 3, y: 3 };
    this.velocity = velocity;
    this.creationTime = Date.now();
}

Bullet.prototype = {
    update() {
        // Add velocity to center to move bullet.
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;
    }
};

window.addEventListener("DOMContentLoaded", () => { let game = new Game(); if (!game) throw new Error("no game"); });
