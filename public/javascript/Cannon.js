import uniqueId from "lodash.uniqueid";

import Vector from "./Vector";
import Body from "./Body";
import * as canvasDraw from "./canvasDraw";
import * as pointUtils from "./pointUtils";
import * as constants from "./constants";

export default class Cannon {
    constructor(game, center, toPoint) {
        this.game = game;
        this.id = uniqueId("cannon");
        this.color = "red";
        this.center = center;
        this.mass = constants.EarthMass / 2;
        this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

        this.updates = 0;

        this.select(toPoint); // creates this.shootVector
    }
    vectorToPoint() {
        let vectorToPoint = {
            x: this.center.x + this.shootVector.getDeltaX(),
            y: this.center.y + this.shootVector.getDeltaY()
        };

        return vectorToPoint;
    }
    update() {
        if (this.updates === 0) {
            this.updates = 50;
            this.game.addBody(new Body(
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
        this.game.cannons.forEach(cannon => cannon.deselect());
        this.selected = true;

        this.shootVector = new Vector(
            100,//pointUtils.distanceBetween(this.center, point),
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