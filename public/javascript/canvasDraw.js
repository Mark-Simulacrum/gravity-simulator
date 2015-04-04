export function setColor(screen, color) {
    if (screen.fillStyle !== color) screen.fillStyle = color;
    if (screen.strokeStyle !== color) screen.strokeStyle = color;
}

export function drawBody(screen, body) {
    screen.beginPath();
    screen.arc(body.center.x, body.center.y, body.radius, 0, 2 * Math.PI, false);
    screen.fill();

    if (body.speed) {
        screen.fillText("s" + body.speed.toFixed(4), body.center.x - body.radius, body.center.y - body.radius);
    }
}

export function drawVector(screen, fromPoint, toPoint) {
    setColor(screen, "blue");
    screen.beginPath();
    screen.moveTo(fromPoint.x, fromPoint.y);
    screen.lineTo(toPoint.x, toPoint.y);
    screen.stroke();
}

export function drawPoint(screen, point, color = "black", size = 1) {
    screen.fillStyle = color;
    screen.beginPath();
    screen.moveTo(point.x, point.y);
    screen.arc(point.x, point.y, size, 0, Math.PI * 2, false);
    screen.fill();
}

export function drawLine(screen, pointA, pointB, color = "black") {
    screen.strokeStyle = color;
    screen.beginPath();
    screen.moveTo(pointA.x, pointA.y);
    screen.lineTo(pointB.x, pointB.y);
    screen.stroke();
}

export function drawLineF(screen, func, color, loopAll) {
    if (loopAll) {
        for (let x = 0; x < screen.canvas.width; x++) {
            drawPoint(screen, {x, y: func(x)}, color);
        }
    } else {
        drawLine(screen, {x: 0, y: func(0)}, {x: screen.canvas.width, y: func(screen.canvas.width)}, color);
    }
}