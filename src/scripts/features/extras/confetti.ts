// Confetti effect thanks to CSS Script: https://www.cssscript.com/demo/confetti-falling-animation/
import { id } from "../../shorthand_functions";

const maxParticleCount = 150;
const particleSpeed = 2;
const colors = [
    "#ec1254",
    "#f27c14",
    "#f27c14",
    "#f5e31d",
    "#1ee8b6",
    "#26a1d5",
];

let streamingConfetti = false;
let animationTimer: any = null;
const particles: any[] = [];
let waveAngle = 0;

function resetParticle(particle: any, width: number, height: number) {
    particle.color = colors[(Math.random() * colors.length) | 0];
    particle.x = Math.random() * width;
    particle.y = Math.random() * height - height;
    particle.diameter = Math.random() * 10 + 5;
    particle.tilt = Math.random() * 10 - 10;
    particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
    particle.tiltAngle = 0;
    return particle;
}

function drawParticles(context: CanvasRenderingContext2D) {
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        context.beginPath();
        context.lineWidth = particle.diameter;
        context.strokeStyle = particle.color;
        const x = particle.x + particle.tilt;
        context.moveTo(x + particle.diameter / 2, particle.y);
        context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
        context.stroke();
    }
}

function updateParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    waveAngle += 0.01;
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (!streamingConfetti && particle.y < -15) {
            particle.y = height + 100;
        } else {
            particle.tiltAngle += particle.tiltAngleIncrement;
            particle.x += Math.sin(waveAngle);
            particle.y =
                (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
            particle.tilt = Math.sin(particle.tiltAngle) * 15;
        }
        if (
            particle.x > width + 20 ||
            particle.x < -20 ||
            particle.y > height
        ) {
            if (streamingConfetti && particles.length <= maxParticleCount) {
                resetParticle(particle, width, height);
            } else {
                particles.splice(i, 1);
                i--;
            }
        }
    }
}

export function startConfetti(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    window.requestAnimFrame = (() =>
        window.requestAnimationFrame ||
        (window as any).webkitRequestAnimationFrame ||
        (window as any).mozRequestAnimationFrame ||
        (window as any).oRequestAnimationFrame ||
        (window as any).msRequestAnimationFrame ||
        ((callback: FrameRequestCallback) =>
            window.setTimeout(callback, 16.6666667)))();

    let canvas = id("confetti-canvas") as HTMLCanvasElement | null;
    if (canvas === null) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("id", "confetti-canvas");
        canvas.setAttribute(
            "style",
            "display:block;z-index:999999;pointer-events:none;position:fixed;top:0;left:0;transition:0.3s opacity ease;",
        );
        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        window.addEventListener(
            "resize",
            () => {
                if (canvas) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
            },
            { passive: true },
        );
    }
    const context = canvas.getContext("2d");
    if (!context) return;

    while (particles.length < maxParticleCount) {
        particles.push(resetParticle({}, width, height));
    }
    streamingConfetti = true;
    if (animationTimer === null) {
        (function runAnimation() {
            context.clearRect(0, 0, window.innerWidth, window.innerHeight);
            if (particles.length === 0) {
                animationTimer = null;
            } else {
                updateParticles();
                drawParticles(context);
                animationTimer = window.requestAnimFrame(runAnimation);
            }
        })();
    }
}

export function stopConfetti(): void {
    streamingConfetti = false;
}

export function toggleConfetti(): void {
    if (streamingConfetti) {
        stopConfetti();
    } else {
        startConfetti();
    }
}
