'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseRadius: number;
    opacity: number;
    color: string;
    pulseUntil: number;
}

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#ffffff', '#6366f1'];
const CONNECTION_DIST = 120;
const MOUSE_RADIUS = 150;
const PULSE_INTERVAL = 3000;
const PULSE_DURATION = 600;

export default function ParticleCanvas({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -9999, y: -9999 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const initParticles = (w: number, h: number) => {
            const count = Math.max(40, Math.floor(w / 14));
            const particles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const r = 1 + Math.random() * 1.5;
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: r,
                    baseRadius: r,
                    opacity: 0.3 + Math.random() * 0.5,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    pulseUntil: 0,
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

        // Pulse interval
        const pulseTimer = setInterval(() => {
            const pts = particlesRef.current;
            if (!pts.length) return;
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const idx = Math.floor(Math.random() * pts.length);
                pts[idx].pulseUntil = Date.now() + PULSE_DURATION;
            }
        }, PULSE_INTERVAL);

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;
            const now = Date.now();
            ctx.clearRect(0, 0, w, h);

            const pts = particlesRef.current;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Update positions
            for (const p of pts) {
                // Mouse attraction
                const dx = mx - p.x;
                const dy = my - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS && dist > 0) {
                    p.vx += (dx / dist) * 0.04;
                    p.vy += (dy / dist) * 0.04;
                }

                // Dampen velocity
                p.vx *= 0.98;
                p.vy *= 0.98;

                // Cap velocity
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 1.5) { p.vx *= 1.5 / speed; p.vy *= 1.5 / speed; }

                p.x += p.vx;
                p.y += p.vy;

                // Boundary wrap
                if (p.x < -10) p.x = w + 10;
                else if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                else if (p.y > h + 10) p.y = -10;

                // Pulse state
                if (now < p.pulseUntil) {
                    p.radius = p.baseRadius + (4 - p.baseRadius) * Math.sin((now % PULSE_DURATION) / PULSE_DURATION * Math.PI);
                } else {
                    p.radius = p.baseRadius;
                }
            }

            // Draw connections
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const alpha = (1 - dist / CONNECTION_DIST) * 0.18;
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
                const isPulsing = now < p.pulseUntil;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.round((isPulsing ? 1.0 : p.opacity) * 255).toString(16).padStart(2, '0');
                ctx.fill();
                if (isPulsing) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
                    ctx.strokeStyle = p.color + '40';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        return () => {
            cancelAnimationFrame(frameRef.current);
            clearInterval(pulseTimer);
            window.removeEventListener('mousemove', onMouseMove);
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
