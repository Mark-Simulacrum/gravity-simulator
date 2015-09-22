import { fromReal } from "./constants";
import { fromReal as fromRealPoint } from "./pointUtils";

let screen;
export function setScreen(newScreen) {
    screen = newScreen;
}

function isPointOutOfBounds(point) {
    return point.x < 0 || point.y < 0 || point.x > screen.canvas.width || point.y > screen.canvas.height;
}

export function setColor(color) {
    if (screen.fillStyle !== color) screen.fillStyle = color;
    if (screen.strokeStyle !== color) screen.strokeStyle = color;
}

export function drawBody(body) {
    let center = fromRealPoint(body.center);
    let radius = fromReal(body.radius);
    if (radius < 1) radius = 1;

    drawPoint(body.center, body.color, radius);

    if (body.selected) {
        let distance = 10;
        radius += distance;
        screen.beginPath();
        screen.moveTo(center.x - radius, center.y - radius);
        screen.lineTo(center.x + radius, center.y - radius);
        screen.lineTo(center.x + radius, center.y + radius);
        screen.lineTo(center.x - radius, center.y + radius);
        screen.lineTo(center.x - radius, center.y - radius);
        screen.stroke();
        radius -= distance;
    }

    if (body.type === "cannon") {
        drawLine(body.center, body.vectorToPoint);
    }

    if (body.type !== "body") {
        drawPoint(body.center, "black", Math.min(radius * 0.1, 4));
    }
}

export function drawPoint(point, color = "black", size = 1) {
    point = fromRealPoint(point);

    if (isPointOutOfBounds(point)) return;

    screen.fillStyle = color;
    screen.beginPath();
    screen.moveTo(point.x, point.y);
    screen.arc(point.x, point.y, size, 0, Math.PI * 2, false);
    screen.fill();
}

export function drawLine(pointA, pointB, color = "black", size = 1) {
    pointA = fromRealPoint(pointA);
    pointB = fromRealPoint(pointB);

    screen.strokeStyle = color;
    screen.strokeWidth = size;
    screen.beginPath();
    screen.moveTo(pointA.x, pointA.y);
    screen.lineTo(pointB.x, pointB.y);
    screen.stroke();
}

export function drawLineF(func, color = "black", size = 1, loopAll) {
    if (loopAll) {
        for (let x = 0; x < screen.canvas.width; x++) {
            drawPoint(screen, {x, y: func(x)}, color, size);
        }
    } else {
        drawLine(screen, {x: 0, y: func(0)}, {x: screen.canvas.width, y: func(screen.canvas.width)}, color, size);
    }
}