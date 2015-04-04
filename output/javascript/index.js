function drawRect(screen, body) {
    if (body instanceof Bullet) {
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


function Invader(game, center) {
    this.game = game;
    this.center = center;
    this.size = { x: 10, y: 10 };

    this.patrolX = 15;

    this.velocity = { x: 0.3, y: 0 };
}

Invader.prototype = {
    update() {
        // If the invader is outside the bounds of their patrol...
        if (this.patrolX < 0 || this.patrolX > 30) {
            // ... reverse direction of movement.
            this.velocity.x = -this.velocity.x;
        }

        // If coin flip comes up and no friends below in this invader's column
        if (Math.random() > 0/*.995*/ ) { //&& !this.game.invadersBelow(this)) {
            // create a bullet just below the invader that will move downward
            let bullet =
            new Bullet(
                { x: this.center.x, y: this.center.y + this.size.y },
                { x: (Math.random() > 0.5 ? 1 : -1) * Math.random() * 10, y: Math.random() * 10 }
                );

            // ... and add the bullet to the game.
            this.game.addBody(bullet);
        }

        // Move according to current x speed.
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;

        // Update variable that keeps track of current position in patrol.
        this.patrolX += this.velocity.x;
    }
};

function createInvaders(game) {
    let invaders = [];

    let invaderSpacing = 30;
    let invaderColumns = Math.floor(game.size.x / invaderSpacing / 2) * 2;
    let invaderRows = 3;

    for (let colNum = 0; colNum < invaderColumns; colNum++) {
        let x = invaderSpacing + (colNum % invaderColumns) * invaderSpacing;

        for (let rowNum = 0; rowNum < invaderRows; rowNum++) {
            invaders.push(new Invader(game, { x, y: invaderSpacing * (rowNum + 1)}));
        }
    }

    return invaders;
}

function KeyBoarder() {
    // Records up/down state of each key that has ever been pressed.
    var keyState = {};

    // When key goes down, record that it is down.
    window.addEventListener('keydown', function(e) {
        keyState[e.keyCode] = true;
    });

    // When key goes up, record that it is up.
    window.addEventListener('keyup', function(e) {
        keyState[e.keyCode] = false;
    });

    // Returns true if passed key is currently down.  `keyCode` is a
    // unique number that represents a particular key on the keyboard.
    this.isDown = function(keyCode) {
      return keyState[keyCode] === true;
  };
}

// Handy constants that give keyCodes human-readable names.
KeyBoarder.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32 };

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

    // Add the invaders to the bodies array.
    this.bodies = this.bodies.concat(createInvaders(this));

    // Add the player to the bodies array.
    this.bodies = this.bodies.concat(new Player(this));

    let tick = () => {
        this.update();
        this.draw(screen);
        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
}

Game.prototype = {
    notColliding(body1) {
        return !this.bodies.some((body2) => colliding(body1, body2));
    },
    update() {
        this.bodies = this.bodies.filter(body => this.isBodyOnScreen(body)/* && this.notColliding(body)*/);

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
        this.bodies.push(body);
    },
    invadersBelow(invader) {
        // If filtered array is not empty, there are invaders below.
        return this.bodies.some(function(b) {
            // Keep `b` if it is an invader, if it is in the same column
            // as `invader`, and if it is somewhere below `invader`.
            return b instanceof Invader &&
            Math.abs(invader.center.x - b.center.x) < b.size.x &&
            b.center.y > invader.center.y;
        });
    },
    isBodyOnScreen(body) {
        return body.center.x - body.size.x / 2 > 0
        && body.center.y - body.size.y / 2 > 0
        && body.center.x + body.size.x / 2 < this.size.x
        && body.center.y + body.size.y / 2 < this.size.y;
    }
};

function Player(game) {
    this.game = game;
    this.size = { x: 20, y: 20 };
    this.center = {x: game.size.x / 2, y: game.size.y -this.size.y * 2 };

    this.keyBoarder = new KeyBoarder();
}

Player.prototype = {
    update() {
        let speed = this.game.size.x * 0.003;

        if (this.keyBoarder.isDown(KeyBoarder.KEYS.LEFT)) {
            if (this.center.x - speed - this.size.x / 2 > 0) this.center.x -= speed;
        } else if (this.keyBoarder.isDown(KeyBoarder.KEYS.RIGHT)) {
            if (this.center.x + speed + this.size.x / 2 < this.game.size.x) this.center.x += speed;
        }

        if (this.keyBoarder.isDown(KeyBoarder.KEYS.SPACE)) {
            let bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.y - 10 }, { x: 0, y: -6 });

            this.game.addBody(bullet);
        }
    }
};

function Bullet(center, velocity) {
    this.center = center;
    this.size = { x: 3, y: 3 };
    this.velocity = velocity;
}

Bullet.prototype = {
    update() {
        // Add velocity to center to move bullet.
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;
    }
};

window.addEventListener("DOMContentLoaded", () => { let game = new Game(); if (!game) throw new Error("no game"); });
