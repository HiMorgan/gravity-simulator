const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const nextPlanet = document.querySelector("#next-planet");
const cursor = document.querySelector("#cursor");
const radiusSlider = document.querySelector("#radius-slider");

const planets = [];
const colors = [
    { color: "yellow", hex: "#ffc800" },
    { color: "green", hex: "#38ba43" },
    { color: "blue", hex: "#2488ed" },
    { color: "red", hex: "#eb173a" }
];
let colorCount = 0;
class Planet {
    constructor(radius, x, y, vx, vy) {
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.Fx;
        this.Fy;
        this.ax;
        this.ay;
        this.mass = 4/3 * Math.PI * (radius ** 3);
        this.color = colors[colorCount % colors.length].hex;
        this.positions = [{ x: x, y: y }];
        this.collided = false;
        colorCount++;
    };
};

let createPlanet = false;
const halfWidth = window.innerWidth / 2;
const halfHeight = window.innerHeight / 2;
const nextPlanetCenter = {
    clientX: halfWidth,
    clientY: halfHeight,
    canvasX: halfWidth,
    canvasY: halfHeight
};
let radius = 64;

const touches = [];
let lastTap;
let tapMoved = false;

let pan = false;
const translatePoint = { x: null, y: null };
let pause = false;
let trails = true;
const numberOfPositions = 60;

function inverseMatrix() {
    return ctx.getTransform().inverse();
};
function scale() {
    return ctx.getTransform().a;
};
function nextPlanetRadius() {
    return radius * scale();
};
function clientToCanvas(clientX, clientY) {
    const clientPoint = new DOMPoint(clientX, clientY);
    const canvasPoint = clientPoint.matrixTransform(inverseMatrix());
    return canvasPoint;
};
function canvasToClient(canvasX, canvasY) {
    const canvasPoint = new DOMPoint(canvasX, canvasY);
    const clientPoint = canvasPoint.matrixTransform(ctx.getTransform());
    return clientPoint;
};

window.addEventListener("contextmenu", e => e.preventDefault());
window.addEventListener("keydown", e => {
    switch (e.key) {
        case " ":
            pause = !pause;
            break;
        case "q":
            trails = !trails;
            break;
        case "z":
            if (e.ctrlKey) {
                planets.length = 0;
            };
            break;
    };
});

const clearButton = document.querySelector("#clear-button");
clearButton.addEventListener("click", () => {
    planets.length = 0;
});

const trailsButton = document.querySelector("#trails-button");
const trailsOn = document.querySelector("#trails-on");
const trailsOff = document.querySelector("#trails-off");
trailsButton.addEventListener("click", () => {
    trails = !trails;
    if (trails) {
        trailsOff.classList.remove("display-none");
        trailsOn.classList.add("display-none");
    } else {
        trailsOff.classList.add("display-none");
        trailsOn.classList.remove("display-none");
    };
});

const pauseButton = document.querySelector("#pause-button");
const playIcon = document.querySelector("#play-icon");
const pauseIcon = document.querySelector("#pause-icon");
pauseButton.addEventListener("click", () => {
    pause = !pause;
    if (pause) {
        pauseIcon.classList.add("display-none");
        playIcon.classList.remove("display-none");
    } else {
        pauseIcon.classList.remove("display-none");
        playIcon.classList.add("display-none");
    };
});

radiusSlider.addEventListener("pointerdown", () => {
    cursor.classList.remove("display-none");
    nextPlanet.classList.remove("display-none");
    nextPlanet.style.left = (halfWidth - radiusSlider.value) + "px";
    nextPlanet.style.top = (halfHeight - radiusSlider.value) + "px";
    cursor.style.left = (halfWidth - 2) + "px";
    cursor.style.top = (halfHeight - 2) + "px";
});
radiusSlider.addEventListener("input", () => {
    radius = radiusSlider.value / scale();
    nextPlanet.style.width = (radiusSlider.value * 2) + "px";
    nextPlanet.style.height = (radiusSlider.value * 2) + "px";
    nextPlanet.style.left = (halfWidth - radiusSlider.value) + "px";
    nextPlanet.style.top = (halfHeight - radiusSlider.value) + "px";
    cursor.style.left = (halfWidth - 2) + "px";
    cursor.style.top = (halfHeight - 2) + "px";
});
radiusSlider.addEventListener("pointerup", () => {
    nextPlanet.classList.add("display-none");
    cursor.classList.add("display-none");
});

function createOrDeletePlanet(e) {
    const canvasPoint = clientToCanvas(e.clientX, e.clientY);
    for (let i = planets.length - 1; i >= 0; i--) {
        const planet = planets[i];
        const dx = (planet.x - canvasPoint.x) ** 2;
        const dy = (planet.y - canvasPoint.y) ** 2;
        const distance = dx + dy;
        const radius = planet.radius ** 2;
        if (distance < radius) {
            planets.splice(i, 1);
            return;
        };
    };
    createPlanet = true;
    nextPlanetCenter.clientX = e.clientX;
    nextPlanetCenter.clientY = e.clientY;
    nextPlanetCenter.canvasX = canvasPoint.x;
    nextPlanetCenter.canvasY = canvasPoint.y;
};

canvas.addEventListener("pointerdown", e => {
    switch (e.pointerType) {
        case "mouse":
            if (e.ctrlKey) {
                pan = true;
                translatePoint.x = e.clientX;
                translatePoint.y = e.clientY;
            } else {
                createOrDeletePlanet(e);
            };
            break;
        case "touch":
            e.newX = e.clientX;
            e.newY = e.clientY;
            touches.push(e);
            if (touches.length === 1) {
                if (Date.now() - lastTap <= 500 && !tapMoved) {
                    createOrDeletePlanet(e);
                    lastTap = null;
                } else {
                    lastTap = Date.now();
                    tapMoved = false;
                };
            } else {
                createPlanet = false;
                nextPlanet.classList.add("display-none");
                cursor.classList.add("display-none");
            };
            break;
    };
});

canvas.addEventListener("pointermove", e => {
    if (createPlanet) {
        nextPlanet.style.left = (nextPlanetCenter.clientX - nextPlanetRadius()) + "px";
        nextPlanet.style.top = (nextPlanetCenter.clientY - nextPlanetRadius()) + "px";
        const dx = e.clientX - nextPlanetCenter.clientX;
        const dy = e.clientY - nextPlanetCenter.clientY;
        const length = Math.hypot(dx, dy);
        cursor.style.width = length + "px";
        const angle = Math.atan2(dy, dx);
        cursor.style.transform = `rotate(${angle}rad)`;
        cursor.style.left = (nextPlanetCenter.clientX - 2) + "px";
        cursor.style.top = (nextPlanetCenter.clientY - 2) + "px";
        nextPlanet.classList.remove("display-none");
        cursor.classList.remove("display-none");
    } else {
        switch (e.pointerType) {
            case "mouse":
                if (pan) {
                    ctx.translate(
                        (e.clientX - translatePoint.x) / scale(),
                        (e.clientY - translatePoint.y) / scale()
                    );
                    translatePoint.x = e.clientX;
                    translatePoint.y = e.clientY;
                };
                nextPlanet.style.left = (e.clientX - nextPlanetRadius()) + "px";
                nextPlanet.style.top = (e.clientY - nextPlanetRadius()) + "px";
                cursor.style.left = (e.clientX - 2) + "px";
                cursor.style.top = (e.clientY - 2) + "px";
                break;
            case "touch":
                const i = touches.findIndex(touch => touch.pointerId === e.pointerId);
                const touch1 = touches[i];
                if (e.clientX != touch1.newX || e.clientY != touch1.newY) {
                    tapMoved = true;
                };
                const dxx = e.clientX - touch1.newX;
                const dyy = e.clientY - touch1.newY;
                ctx.translate(
                    (dxx / scale()) / touches.length,
                    (dyy / scale()) / touches.length
                );
                if (touches.length === 2) {
                    const j = (i === 0) ? 1 : 0;
                    const touch2 = touches[j];
                    const dx = touches[1].newX - touches[0].newX;
                    const dy = touches[1].newY - touches[0].newY;
                    const ddx = e.clientX - touch2.newX;
                    const ddy = e.clientY - touch2.newY;
                    const midpoint = clientToCanvas(
                        (e.clientX + touch2.newX) / 2,
                        (e.clientY + touch2.newY) / 2
                    );
                    const oldDistance = Math.hypot(dx, dy);
                    const newDistance = Math.hypot(ddx, ddy);
                    const factor = newDistance / oldDistance;
                    ctx.translate(midpoint.x, midpoint.y);
                    ctx.scale(factor, factor);
                    ctx.translate(-midpoint.x, -midpoint.y);
                    radius = radiusSlider.value / scale();
                };
                touch1.newX = e.clientX;
                touch1.newY = e.clientY;
                break;
        };
    };
});

canvas.addEventListener("pointerup", e => {
    const i = touches.findIndex(touch => touch.pointerId === e.pointerId);
    touches.splice(i, 1);
    if (createPlanet) {
        const canvasPoint = clientToCanvas(e.clientX, e.clientY);
        const factor = .02;
        const dx = (nextPlanetCenter.canvasX - canvasPoint.x) * factor;
        const dy = (nextPlanetCenter.canvasY - canvasPoint.y) * factor;
        planets.push(new Planet(
            radius,
            nextPlanetCenter.canvasX,
            nextPlanetCenter.canvasY,
            dx, 
            dy
        ));
        createPlanet = false;
        const i = colorCount % colors.length;
        const j = (colorCount - 1) % colors.length;
        nextPlanet.classList.add(colors[i].color);
        nextPlanet.classList.remove(colors[j].color);
        cursor.style.width = 2 + "px";
        if (e.pointerType === "touch") {
            nextPlanet.classList.add("display-none");
            cursor.classList.add("display-none");
        };
    } else {
        pan = false;
    };
});

canvas.addEventListener("wheel", e => {
    const precision = .1;
    const factor = 1 + (precision * Math.sign(e.wheelDeltaY));
    if (e.ctrlKey) {
        e.preventDefault();
        const canvasPoint = clientToCanvas(e.clientX, e.clientY);
        ctx.translate(canvasPoint.x, canvasPoint.y);
        ctx.scale(factor, factor);
        ctx.translate(-canvasPoint.x, -canvasPoint.y);
        if (createPlanet) {
            const clientPoint = canvasToClient(
                nextPlanetCenter.canvasX,
                nextPlanetCenter.canvasY
            );
            nextPlanetCenter.clientX = clientPoint.x;
            nextPlanetCenter.clientY = clientPoint.y;
            const length = Math.hypot(
                e.clientX - nextPlanetCenter.clientX,
                e.clientY - nextPlanetCenter.clientY
            );
            cursor.style.width = length + "px";
            cursor.style.left = (nextPlanetCenter.clientX - 2) + "px";
            cursor.style.top = (nextPlanetCenter.clientY - 2) + "px";
        };
    } else {
        radius *= factor;
    };
    nextPlanet.style.width = (radius * 2) * scale() + "px";
    nextPlanet.style.height = (radius * 2) * scale() + "px";
    if (createPlanet) {
        nextPlanet.style.left = (nextPlanetCenter.clientX - nextPlanetRadius()) + "px";
        nextPlanet.style.top = (nextPlanetCenter.clientY - nextPlanetRadius()) + "px";
    } else {
        nextPlanet.style.left = (e.clientX - nextPlanetRadius()) + "px";
        nextPlanet.style.top = (e.clientY - nextPlanetRadius()) + "px";
    };
});

function loop(){
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (trails) {
        for (let i = 0; i < planets.length; i++) {
            const planet = planets[i];
            const positions = planet.positions;
            if (positions.length > 1) {
                ctx.lineWidth = 2 / scale();
                ctx.strokeStyle = planet.color;
                for (let j = 0; j < positions.length - 1; j++) {
                    ctx.globalAlpha = (numberOfPositions + 1 - (positions.length - j)) / numberOfPositions;
                    let x1 = positions[j].x;
                    let y1 = positions[j].y;
                    let x2 = positions[j + 1].x;
                    let y2 = positions[j + 1].y;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                };
            };
        };
    };
    for (let i = 0; i < planets.length; i++) {
        const planet = planets[i];
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, 2 * Math.PI);
        ctx.fill();
    };
    if (!pause) {
        for (let i = 0; i < planets.length; i++) {
            const planet1 = planets[i];
            const m1 = planet1.mass;
            planet1.Fx = null;
            planet1.Fy = null;
            for (let j = 0; j < planets.length; j++) {
                if (i === j) continue;
                const planet2 = planets[j];
                const m2 = planet2.mass;
                const dx = planet2.x - planet1.x;
                const dy = planet2.y - planet1.y;
                const r2 = (dx ** 2) + (dy ** 2);
                const G = .002;
                const F = G * ((m1 * m2) / r2);
                const r = Math.sqrt(r2);
                const cos = (dx * r) / r2;
                const sin = (dy * r) / r2;
                planet1.Fx += F * cos;
                planet1.Fy += F * sin;
                planet1.ax = planet1.Fx / m1;
                planet1.ay = planet1.Fy / m1;
                planet1.vx += planet1.ax;
                planet1.vy += planet1.ay;
            };
        };
        for (let i = 0; i < planets.length; i++) {
            const planet1 = planets[i];
            if (planet1.collided) continue;
            const positions = planet1.positions;
            planet1.x += planet1.vx;
            planet1.y += planet1.vy;
            positions.push({
                x: planet1.x,
                y: planet1.y
            });
            if (positions.length > numberOfPositions) {
                positions.shift();
            };
            for (let j = i + 1; j < planets.length; j++) {
                const planet2 = planets[j];
                if (planet2.collided) continue;
                const dx = planet2.x - planet1.x;
                const dy = planet2.y - planet1.y;
                let distance = (dx ** 2) + (dy ** 2);
                let radii = planet1.radius + planet2.radius;
                if (distance < (radii ** 2)) {
                    let biggest;
                    let smallest;
                    if (planet1.mass === planet2.mass) {
                        const coinFlip = Math.round(Math.random());
                        biggest = (coinFlip === 0) ? planet1 : planet2;
                        smallest = (coinFlip === 0) ? planet2 : planet1;
                    } else {
                        biggest = (planet1.mass > planet2.mass) ? planet1 : planet2;
                        smallest = (planet1.mass > planet2.mass) ? planet2 : planet1;
                    };
                    const m1 = biggest.mass;
                    const m2 = smallest.mass;
                    biggest.vx = ((m1 * biggest.vx) + (m2 * smallest.vx)) / (m1 + m2);
                    biggest.vy = ((m1 * biggest.vy) + (m2 * smallest.vy)) / (m1 + m2);
                    biggest.mass += smallest.mass;
                    biggest.radius = Math.cbrt((3 * biggest.mass) / (4 * Math.PI));
                    smallest.collided = true;
                    if (smallest === planet1) break;
                };
            };
        };
        for (let i = planets.length - 1; i >= 0; i--) {
            if (planets[i].collided) {
                planets.splice(i, 1);
            };
        };
    };
    requestAnimationFrame(loop);
};

canvas.width = screen.width;
canvas.height = screen.height;
if (matchMedia("screen and (max-width: 1024px)").matches) {
    nextPlanet.classList.add("display-none");
    cursor.classList.add("display-none");
};
nextPlanet.style.width = (radius * 2) + "px";
nextPlanet.style.height = (radius * 2) + "px";
nextPlanet.style.left = (halfWidth - radius) + "px";
nextPlanet.style.top = (halfHeight - radius) + "px";
cursor.style.left = (halfWidth - 2) + "px";
cursor.style.top = (halfHeight - 2) + "px";
radiusSlider.max = 128;
radiusSlider.value = radius;
requestAnimationFrame(loop);
