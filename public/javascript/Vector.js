export default class Vector {
    constructor(length, direction, unit) {
        if (unit === undefined) throw new Error("missing argument: unit");
        if (length < 0) throw new Error("length of a vector cannot be negative");

        this.length = length;
        this.direction = direction;
        this.unit = unit;
    }
    clone() {
        return new Vector(this.length, this.direction, this.unit);
    }
    getDeltaX() {
        return this.length * Math.cos(this.direction);
    }
    getDeltaY() {
        return this.length * Math.sin(this.direction);
    }
    unitVector() {
        return new Vector(1, this.direction, this.unit);
    }
    angleTo(vector) {
        let angle = this.direction - vector.direction;
        return angle < 0 ? angle + Math.PI : angle;
    }
    projectionOnto(axis) {
        let aX = new Vector(
            Math.abs(this.length * Math.cos(this.angleTo(axis))),
            axis.direction,
            this.unit
        );

        console.log("Angle to", this.angleTo(axis));
        console.log("aX length", aX.length);

        let aY = this.subtract(aX);

        return { a: aX, b: aY };
    }
    opposite() {
        return new Vector(
            this.length,
            this.direction > Math.PI ? this.direction - Math.PI : this.direction + Math.PI,
            this.unit
        );
    }
    add(vector) {
        if (this.unit !== vector.unit) throw new Error("Adding incompatible vectors.");

        let totalDeltaX = this.getDeltaX() + vector.getDeltaX();
        let totalDeltaY = this.getDeltaY() + vector.getDeltaY();

        let length = Math.sqrt(
            Math.pow(totalDeltaX, 2) +
            Math.pow(totalDeltaY, 2)
        );

        let direction = Math.atan2(totalDeltaY, totalDeltaX);

        return new Vector(length, direction, this.unit);
    }
    subtract(vector) {
        return this.add(vector.opposite());
    }
}