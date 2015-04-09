import Vector from "./Vector";
import Body from "./Body";
import * as canvasDraw from "./canvasDraw";
import * as pointUtils from "./pointUtils";
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

        this.select(toPoint); // creates this.shootVector

        initNum++;
    }
    vectorToPoint() {
        let scaledVector = this.shootVector.scale(10e3);

        let vectorToPoint = {
            x: this.center.x + scaledVector.getDeltaX(),
            y: this.center.y + scaledVector.getDeltaY()
        };

        return vectorToPoint;
    }
    update() {
        if (this.updates <= 0) {
            this.updates = this.rate;
            this.game.addBody(new Body(
                this.game,
                { x: this.center.x, y: this.center.y },
                true,
                {
                    initialSpeed: this.shootVector.clone()
                }
            ));
        }

        if (this.updates > this.rate) {
            this.updates = this.rate;
        }

        canvasDraw.drawLine(this.center, this.vectorToPoint());

        --this.updates;
    }
    select(point) {
        this.shootVector = new Vector(
            7000,//pointUtils.distanceBetween(this.center, point),
            point === undefined ? Math.PI :
            Math.atan2(
                this.center.y - point.y,
                this.center.x - point.x
            ) + Math.PI,
            "m/s"
        );
    }
    deselect() {
        this.selected = false;
    }
}