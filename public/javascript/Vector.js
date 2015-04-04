export default class Vector {
    constructor(length, direction) {
        this.length = length;
        this.direction = direction;
    }
    clone() {
        return new Vector(this.length, this.direction);
    }
    getDeltaX() {
        return this.length * Math.cos(this.direction);
    }
    getDeltaY() {
        return this.length * Math.sin(this.direction);
    }
    equals(vector) {
        return this.length === vector.length && this.direction === vector.direction;
    }
    add(vector) {
        let totalDeltaX = this.getDeltaX() + vector.getDeltaX();
        let totalDeltaY = this.getDeltaY() + vector.getDeltaY();

        let force = Math.sqrt(
            Math.pow(totalDeltaX, 2) +
            Math.pow(totalDeltaY, 2)
        );

        let direction = Math.atan2(totalDeltaY, totalDeltaX);

        return new Vector(force, direction);
    };
}