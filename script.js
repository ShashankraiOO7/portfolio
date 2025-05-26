// JavaScript code will go here 

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('aiCanvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Config needs to be defined before setCanvasSize calls it
    const config = {
        nodeColor: 'rgba(50, 150, 255, 0.7)', // Deep blue nodes
        connectionColor: 'rgba(80, 180, 255, 0.3)', // Lighter blue connections
        nodeRadius: { min: 0.8, max: 2.0 }, // Smaller, more numerous nodes
        nodeSpeed: 0.25, // Slow, subtle movement
        connectionDistance: 130, // Connect nodes that are closer
        numNodesPerArea: 28000, // Density: 1 node per 28000 sq pixels

        // Streaks - more subtle, less frequent
        streakBlueColor: 'rgba(150, 200, 255, 0.2)', // Fainter blue streaks
        streakOrangeColor: 'rgba(255, 150, 50, 0.15)', // Fainter orange accent streaks
        streakWidth: { min: 0.3, max: 1.2 },
        streakSpeed: { min: 1, max: 2.5 },
        numBlueStreaks: 8, // Reduced number
        numOrangeStreaks: 3, // Reduced number

        // "Code rain" / Particles - more sparse and subtle
        particleColor: 'rgba(200, 220, 255, 0.6)', // Light, faint particles
        numParticlesPerFrame: 8, // Fewer particles per frame for a sparser look
        particleSize: {min: 0.5, max: 1.2},

        // Glowing effect for some nodes
        glowingNodeChance: 0.05, // 5% chance for a node to glow
        glowingNodeColorBase: 'rgba(220, 240, 255, 0.8)', // Base color for glowing nodes (bright blue/white)
        glowingNodePulseColor: 'rgba(255, 200, 100, 0.5)', // Accent pulse color (orange/amber)

        // Simpler code rain (less dense)
        codeRainChars: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\|{};:[]()=+-*!',
        codeRainFontSize: 10,
        codeRainColor: 'rgba(0, 100, 150, 0.1)', // Very subtle, dark blue-green rain
        codeRainSpeed: 1,
        codeRainColumns: [], // Will be populated in setCanvasSize
        numCodeRainColumns: 0, // Will be calculated in setCanvasSize
    };

    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        config.numCodeRainColumns = Math.floor(canvas.width / 15); // Approx column width of 15px
        config.codeRainColumns = [];
        for (let i = 0; i < config.numCodeRainColumns; i++) {
            if (config.codeRainChars) { // Ensure chars are available
                 config.codeRainColumns[i] = {
                    y: Math.random() * canvas.height,
                    char: config.codeRainChars[Math.floor(Math.random() * config.codeRainChars.length)]
                };
            }
        }
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * (config.nodeRadius.max - config.nodeRadius.min) + config.nodeRadius.min;
            this.vx = (Math.random() - 0.5) * config.nodeSpeed;
            this.vy = (Math.random() - 0.5) * config.nodeSpeed;
            this.connections = [];
            this.pulsePhase = Math.random() * Math.PI * 2; // For pulsing effect
            this.isGlowing = Math.random() < config.glowingNodeChance;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.pulsePhase += 0.03; // Speed of pulse

            // Boundary collision (bounce)
            if (this.x < -this.radius || this.x > canvas.width + this.radius) this.vx *= -1;
            if (this.y < -this.radius || this.y > canvas.height + this.radius) this.vy *= -1;
        }
        draw(context) {
            // Pulsing effect for all nodes, more pronounced for glowing ones
            const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5; // Varies between 0 and 1
            let baseAlpha = parseFloat(config.nodeColor.match(/(\d*\.?\d+)\)/)[1]);
            let finalAlpha = baseAlpha * (0.5 + pulse * 0.5); // Modulate alpha with pulse
            let color = config.nodeColor.replace(/(\d*\.?\d+)\)/, `${finalAlpha})`);

            if (this.isGlowing) {
                const glowPulse = Math.sin(this.pulsePhase * 0.5) * 0.5 + 0.5; // Slower pulse for glow
                // Draw outer glow
                context.fillStyle = config.glowingNodePulseColor.replace(/(\d*\.?\d+)\)/, `${(0.3 + glowPulse * 0.4)})`);
                context.beginPath();
                context.arc(this.x, this.y, this.radius + 3 + glowPulse * 3, 0, Math.PI * 2);
                context.fill();
                // Brighter color for the node itself
                color = config.glowingNodeColorBase.replace(/(\d*\.?\d+)\)/, `${(0.8 + pulse * 0.2)})`);
            }

            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
        }
    }

    class Streak {
        constructor(isOrange = false) {
            this.y = Math.random() * canvas.height;
            this.x = Math.random() * canvas.width - canvas.width; // Start off-screen left
            this.length = Math.random() * (canvas.width * 0.4) + (canvas.width * 0.1); // Length relative to canvas width
            this.speed = Math.random() * (config.streakSpeed.max - config.streakSpeed.min) + config.streakSpeed.min;
            this.isOrange = isOrange;
            this.color = isOrange ? config.streakOrangeColor : config.streakBlueColor;
            this.lineWidth = Math.random() * (config.streakWidth.max - config.streakWidth.min) + config.streakWidth.min;
        }
        update() {
            this.x += this.speed;
            if (this.x > canvas.width) {
                this.x = -this.length; // Reset off-screen left
                this.y = Math.random() * canvas.height; // New vertical position
            }
        }
        draw(context) {
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(this.x + this.length, this.y);
            context.strokeStyle = this.color;
            context.lineWidth = this.lineWidth;
            context.stroke();
        }
    }

    const nodes = [];
    const numNodes = Math.floor(window.innerWidth * window.innerHeight / config.numNodesPerArea);
    for (let i = 0; i < numNodes; i++) {
        nodes.push(new Node(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    const streaks = [];
    for (let i = 0; i < config.numBlueStreaks; i++) streaks.push(new Streak());
    for (let i = 0; i < config.numOrangeStreaks; i++) streaks.push(new Streak(true));

    // Pre-calculate connections (optional, can be dynamic)
    nodes.forEach(node => {
        nodes.forEach(otherNode => {
            if (node !== otherNode) {
                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < config.connectionDistance) node.connections.push(otherNode);
            }
        });
    });
    
    const drawCodeRain = (context) => {
        if (!config.codeRainColumns || config.codeRainColumns.length === 0) return;
        context.fillStyle = config.codeRainColor;
        context.font = `${config.codeRainFontSize}px monospace`;
        for (let i = 0; i < config.codeRainColumns.length; i++) {
            const column = config.codeRainColumns[i];
            if (column && column.char) { // Check if column and char exist
                context.fillText(column.char, i * 15, column.y); // Use 15 as approx char width for column spacing
                column.y += config.codeRainSpeed;
                if (column.y > canvas.height && Math.random() > 0.95) { // Randomly reset column
                    column.y = 0;
                    column.char = config.codeRainChars[Math.floor(Math.random() * config.codeRainChars.length)];
                }
            }
        }
    };


    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        
        // Draw subtle code rain first (background layer)
        drawCodeRain(ctx);

        // Draw streaks
        streaks.forEach(s => { s.update(); s.draw(ctx); });

        // Draw connections
        nodes.forEach(node => {
            node.connections.forEach(connectedNode => {
                const dx = node.x - connectedNode.x;
                const dy = node.y - connectedNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                // Fade connection with distance
                const alpha = (1 - (distance / config.connectionDistance)) * 0.5; // Max alpha 0.5
                if (alpha > 0) {
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(connectedNode.x, connectedNode.y);
                    // Use the base RGB from config.connectionColor and apply dynamic alpha
                    const baseColorMatch = config.connectionColor.match(/rgba\(([^)]+)\)/);
                    if (baseColorMatch && baseColorMatch[1]) {
                        const baseColor = baseColorMatch[1].split(',').slice(0, 3).join(',');
                        ctx.strokeStyle = `rgba(${baseColor}, ${Math.max(0, alpha)})`; // Ensure alpha isn't negative
                        ctx.lineWidth = 0.4; // Fine lines for connections
                        ctx.stroke();
                    }
                }
            });
        });

        // Draw and update nodes
        nodes.forEach(node => { node.update(); node.draw(ctx); });

        // Draw random particles (simulating data bits or dust)
        for (let i = 0; i < config.numParticlesPerFrame; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * (config.particleSize.max - config.particleSize.min) + config.particleSize.min;
            ctx.fillStyle = config.particleColor;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        requestAnimationFrame(animate);
    };
    animate();

    // Blog Slider Logic
    const blogTrack = document.querySelector('#blogs .blog-slider-track');
    const blogSlides = Array.from(blogTrack ? blogTrack.children : []);
    const nextBlogButton = document.querySelector('#blogs .blog-slider-btn.next');
    const prevBlogButton = document.querySelector('#blogs .blog-slider-btn.prev');

    if (blogTrack && blogSlides.length > 0 && nextBlogButton && prevBlogButton) {
        let slideWidth = blogSlides[0].getBoundingClientRect().width;
        let currentIndex = 0;

        const updateSlideWidthAndPosition = () => {
            if (blogSlides.length === 0) return;
            slideWidth = blogSlides[0].getBoundingClientRect().width;
            if(blogTrack) { // Ensure blogTrack is not null
                blogTrack.style.transition = 'none'; // Disable transition for instant reposition
                blogTrack.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
                // Force reflow/repaint before re-enabling transition
                //offsetHeight is a common trick for this
                void blogTrack.offsetHeight; 
                blogTrack.style.transition = 'transform 0.5s ease-in-out';
            }
        };

        const updateButtons = () => {
            if (prevBlogButton) prevBlogButton.disabled = currentIndex === 0;
            if (nextBlogButton) nextBlogButton.disabled = currentIndex === blogSlides.length - 1;
        };

        if (nextBlogButton) {
            nextBlogButton.addEventListener('click', () => {
                if (currentIndex < blogSlides.length - 1) {
                    currentIndex++;
                    if(blogTrack) blogTrack.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
                    updateButtons();
                }
            });
        }

        if (prevBlogButton) {
            prevBlogButton.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    if(blogTrack) blogTrack.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
                    updateButtons();
                }
            });
        }
        
        updateButtons(); // Initial state
        window.addEventListener('resize', updateSlideWidthAndPosition);
        // Initial call to position correctly if window starts at a different size
        if (blogSlides.length > 0) updateSlideWidthAndPosition(); 

    } else {
        // console.log for missing blog elements if needed
    }
}); 