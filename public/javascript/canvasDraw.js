import {fromReal} from "./constants";

let screen;
export function setScreen(newScreen) {
    screen = newScreen;
}

function convertPoint(point) {
    return {
        x: fromReal(point.x),
        y: fromReal(point.y)
    };
}

export function setColor(color) {
    if (screen.fillStyle !== color) screen.fillStyle = color;
    if (screen.strokeStyle !== color) screen.strokeStyle = color;
}

export function drawBody(body) {
    setColor(body.color);

    let center = convertPoint(body.center);
    let radius = fromReal(body.radius);
    if (radius < 1) {
        console.log("radius is tiny!", radius);
        radius = 1;
    }

    screen.beginPath();
    screen.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    screen.fill();

    if (body.id.startsWith("attractor")) {
        setColor("black");
        screen.beginPath();
        screen.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
        screen.stroke();
    }
}

export function drawPoint(point, color = "black", size = 1) {
    point = convertPoint(point);

    screen.fillStyle = color;
    screen.beginPath();
    screen.moveTo(point.x, point.y);
    screen.arc(point.x, point.y, size, 0, Math.PI * 2, false);
    screen.fill();
}

export function drawLine(pointA, pointB, color = "black", size = 1) {
    pointA = convertPoint(pointA);
    pointB = convertPoint(pointB);

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