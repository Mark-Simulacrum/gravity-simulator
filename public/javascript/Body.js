import Vector from "./Vector.js";
import * as constants from "./constants";
import * as pointUtils from "./pointUtils";

import * as movementUtils from "./movementUtils";

let initNum = 0;
export default class Body {
    constructor(game, center, options = {}) {
        this.game = game;
        this.center = center;

        this.isAlive = true;
        this.type = "body";
        this.id = initNum;

        this.mass = constants.EarthMass / 100;
        this.radius = this.mass / constants.EarthMass * constants.EarthRadius;

        this.speed = options.initialSpeed;

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