import Vector from "./Vector";
import Body from "./Body";
import * as canvasDraw from "./canvasDraw";
import * as constants from "./constants";

let initNum = 0;

export default class Cannon {
    constructor(game, center, toPoint) {
        this.game = game;
        this.type = "cannon";
        this.id = initNum;
        this.isAlive = true;
        this.color = "red";
        this.center = center;
        this.mass = constants.EarthMass / 2;
        this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

        this.updates = 0;
        this.rate = 50;

        this.shootPointDelta = null;
        this.select(toPoint); // creates this.shootVector

        initNum++;
    }
    vectorToPoint() {
        return {
            x: this.center.x + this.shootPointDelta.x,
            y: this.center.y + this.shootPointDelta.y
        };
    }
    update() {
        if (this.updates <= 0 || this.updates > this.rate) {
            this.updates = this.rate;

            this.game.bodies.push(new Body(
                this.game,
                { x: this.center.x, y: this.center.y },
                true,
                {
                    initialSpeed: this.shootVector.clone()
                }
            ));
        }

        canvasDraw.drawLine(this.center, this.vectorToPoint());

        --this.updates;
    }
    select(point) {
        this.shootVector = new Vector(
            7000,
            point === undefined ? Math.PI :
            Math.atan2(
                this.center.y - point.y,
                this.center.x - point.x
            ) + Math.PI,
            "m/s"
        );

        const scaledVector = this.shootVector.scale(10e3);
        this.shootPointDelta = {
            x: scaledVector.getDeltaX(),
            y: scaledVector.getDeltaY()
        };
    }
    deselect() {
        this.selected = false;
    }
}