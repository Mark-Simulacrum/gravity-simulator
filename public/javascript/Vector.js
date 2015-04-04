function Vector(length, direction) {
    this.length = length;
    this.direction = direction;
}

Vector.prototype.getDeltaX = function () {
    return this.length * Math.cos(this.direction);
};

Vector.prototype.getDeltaY = function () {
    return this.length * Math.sin(this.direction);
};

Vector.prototype.add = function (vector) {
    let totalDeltaX = this.getDeltaX() + vector.getDeltaX();
    let totalDeltaY = this.getDeltaY() + vector.getDeltaY();

    let force = Math.sqrt(
        Math.pow(totalDeltaX, 2) +
        Math.pow(totalDeltaY, 2)
    );

    let direction = Math.atan2(totalDeltaY, totalDeltaX);

    return new Vector(force, direction);
};

export default Vector;