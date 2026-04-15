'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    color: string;
}

const COLORS = ['16,185,129', '6,182,212', '139,92,246'];
const CONNECTION_DIST = 100;
const MAX_PARTICLES = 35;
const FPS = 30;
const FRAME_MS = 1000 / FPS;

export default function ParticleCanvas({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const lastFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const initParticles = (w: number, h: number) => {
            const count = Math.min(MAX_PARTICLES, Math.max(20, Math.floor(w / 35)));
            const particles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: 1 + Math.random() * 1,
                    opacity: 0.25 + Math.random() * 0.35,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                });
            }
            particlesRef.current = particles;
        };

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            initParticles(canvas.width, canvas.height);
        };

        resize();

        const animate = (time: number) => {
            frameRef.current = requestAnimationFrame(animate);

            // Throttle to target FPS
            if (time - lastFrameRef.current < FRAME_MS) return;
            lastFrameRef.current = time;

            const w = canvas.width;
            const h = canvas.height;
            const pts = particlesRef.current;

            ctx.clearRect(0, 0, w, h);

            // Update positions
            for (const p of pts) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                else if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                else if (p.y > h) p.y = 0;
            }

            // Draw connections
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const dist = dx * dx + dy * dy;
                    if (dist < CONNECTION_DIST * CONNECTION_DIST) {
                        const alpha = (1 - Math.sqrt(dist) / CONNECTION_DIST) * 0.12;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            for (const p of pts) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
                ctx.fill();
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        return () => {
            cancelAnimationFrame(frameRef.current);
            ro.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ pointerEvents: 'none' }}
        />
    );
}
