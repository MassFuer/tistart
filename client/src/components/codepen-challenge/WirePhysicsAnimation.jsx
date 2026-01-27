import { useRef, useEffect } from 'react';

const WirePhysicsAnimation = () => {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;

        // Configuration
        const config = {
            gravity: 0.5,
            friction: 0.938,
            groundFriction: 0.7,
            segmentLength: 11,
            iterations: 10,
            wireCount: 30,
            wireColor: '#222222',
            imgScale: 1.0,
            attachOffsetY: 0.3
        };

        const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Image Object
        const imgObj = {
            element: new Image(),
            baseWidth: 100,  
            baseHeight: 100, 
            currentWidth: 100,
            currentHeight: 100,
            loaded: false
        };

        imgObj.element.src = 'https://iili.io/f8g5R3u.md.png';
        imgObj.element.onload = () => { 
            imgObj.loaded = true;
            imgObj.baseWidth = imgObj.element.width;
            imgObj.baseHeight = imgObj.element.height;
            updateImageSize();
            initScene(); 
        };

        const updateImageSize = () => {
            if (!imgObj.loaded) return;
            const MAX_BASE = 300;
            let w = imgObj.baseWidth;
            let h = imgObj.baseHeight;
            
            if (w > MAX_BASE) {
                const ratio = MAX_BASE / w;
                w = MAX_BASE;
                h = h * ratio;
            }

            imgObj.currentWidth = w * config.imgScale;
            imgObj.currentHeight = h * config.imgScale;
        };

        // Physics Classes
        class Point {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.oldx = x;
                this.oldy = y;
                this.pinned = false;
            }

            update() {
                if (this.pinned) return;

                const vx = (this.x - this.oldx) * config.friction;
                const vy = (this.y - this.oldy) * config.friction;

                this.oldx = this.x;
                this.oldy = this.y;

                this.x += vx;
                this.y += vy;
                this.y += config.gravity;

                const floorLevel = height - 2;
                if (this.y >= floorLevel) {
                    this.y = floorLevel;
                    const velX = this.x - this.oldx;
                    this.oldx = this.x - (velX * config.groundFriction);
                }
            }

            setPos(x, y) {
                this.x = x;
                this.y = y;
                this.oldx = x;
                this.oldy = y;
            }
        }

        class Stick {
            constructor(p1, p2) {
                this.p1 = p1;
                this.p2 = p2;
            }

            update() {
                const dx = this.p2.x - this.p1.x;
                const dy = this.p2.y - this.p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance === 0) return;

                const difference = config.segmentLength - distance;
                const percent = difference / distance / 2;
                const offsetX = dx * percent;
                const offsetY = dy * percent;

                if (!this.p1.pinned) {
                    this.p1.x -= offsetX;
                    this.p1.y -= offsetY;
                }
                if (!this.p2.pinned) {
                    this.p2.x += offsetX;
                    this.p2.y += offsetY;
                }
            }
        }

        class Wire {
            constructor(index, total) {
                this.index = index;
                this.total = total;
                this.points = [];
                this.sticks = [];
                this.thickness = 2 + Math.random() * 3;
                this.anchorOffsetRatio = (Math.random() - 0.5) * 0.7; // Range: -0.35 to 0.35
                this.initWire();
            }

            initWire() {
                this.points = [];
                this.sticks = [];

                // Start coordinates (Image Attachment Point)
                const startX = mouse.x;
                // If not loaded, default to some reasonable offset
                const currentH = imgObj.loaded ? imgObj.currentHeight : 100;
                const startY = mouse.y + (currentH * config.attachOffsetY);

                const wallZoneHeight = height / 2;
                const step = wallZoneHeight / (this.total > 1 ? this.total - 1 : 1);
                const wallY = wallZoneHeight - (this.index * step);
                const endX = width;
                const endY = wallY;

                const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const totalLength = Math.max(dist * 1.3, width * 0.8);
                const count = Math.floor(totalLength / config.segmentLength);

                for (let i = 0; i <= count; i++) {
                    const t = i / count;
                    const px = startX + (endX - startX) * t;
                    const py = startY + (endY - startY) * t;

                    const p = new Point(px, py);
                    this.points.push(p);

                    if (i > 0) {
                        this.sticks.push(new Stick(this.points[i - 1], p));
                    }
                }

                this.points[0].pinned = true;
                const last = this.points[this.points.length - 1];
                last.pinned = true;
                last.setPos(endX, endY);
            }

            update() {
                // Update Cursor Attachment
                const currentW = imgObj.loaded ? imgObj.currentWidth : 100;
                const currentH = imgObj.loaded ? imgObj.currentHeight : 100;

                const offsetX = this.anchorOffsetRatio * currentW;
                
                const attachX = mouse.x + offsetX;
                const attachY = mouse.y + (currentH * config.attachOffsetY); 
                
                this.points[0].setPos(attachX, attachY);

                // Update Wall Attachment
                const wallZoneHeight = height / 2;
                const step = wallZoneHeight / (this.total > 1 ? this.total - 1 : 1);
                const wallY = wallZoneHeight - (this.index * step);

                const last = this.points[this.points.length - 1];
                last.setPos(width, wallY);

                // Physics
                for (let i = 0; i < this.points.length; i++) {
                    this.points[i].update();
                }
                for (let j = 0; j < config.iterations; j++) {
                    for (let i = 0; i < this.sticks.length; i++) {
                        this.sticks[i].update();
                    }
                }
            }

            draw() {
                ctx.beginPath();
                ctx.strokeStyle = config.wireColor;
                ctx.lineWidth = this.thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length; i++) {
                    ctx.lineTo(this.points[i].x, this.points[i].y);
                }
                ctx.stroke();
            }
        }

        let wires = [];

        const initScene = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            wires = [];
            for (let i = 0; i < config.wireCount; i++) {
                wires.push(new Wire(i, config.wireCount));
            }
        };

        const loop = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Draw wires
            wires.forEach(wire => {
                wire.update();
                wire.draw();
            });

            // Draw image
            if (imgObj.loaded) {
                const w = imgObj.currentWidth;
                const h = imgObj.currentHeight;
                ctx.drawImage(imgObj.element, mouse.x - w / 2, mouse.y - h / 2, w, h);
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        // Event Listeners
        const handleResize = () => {
            initScene();
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleTouchMove = (e) => {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        initScene();
        loop();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
            style={{ width: '100%', height: '100%', background: '#e0e0e0' }}
        />
    );
};

export default WirePhysicsAnimation;
