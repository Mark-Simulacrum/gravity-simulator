import Vector from "./Vector.js";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";

import * as movementUtils from "./movementUtils";

let initNum = 0;
export default class Body {
    constructor(game, center, isManual, options = {}) {
        this.game = game;
        this.center = center;
        this.isManual = isManual;

        this.isAlive = true;
        this.type = "body";
        this.id = initNum;
        this.originalCenter = { x: center.x, y: center.y };

        this.mass = constants.EarthMass / 2;
        this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

        let injectionVector = options.initialSpeed !== undefined ? options.initialSpeed : new Vector(
            5500,
            0,
            "m/s"
        );

        this.startSpeed = injectionVector.length;
        this.speed = injectionVector;
        this.timeSinceUpdate = 0;

        initNum++;
    }

    update(timeSinceUpdate) {
        const affectingObjects = this.game.attractors.concat(this.game.deflectors);

        let { acceleration, delta } = movementUtils.moveObject(this,
            timeSinceUpdate,
            affectingObjects);


        let min = 255;
        let max = 360;
        let hue = Math.min(acceleration / max, 1) * (max - min) + min;
        this.color = `hsl(${hue}, 100%, 70%)`;

        this.isAlive = !pointUtils.willCollide(this, delta, affectingObjects);
    }
}