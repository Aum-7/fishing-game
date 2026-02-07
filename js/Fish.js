export class Fish {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.width = 40;
        this.height = 30;
        
        // Randomize starting position and speed
        this.x = Math.random() * canvasWidth;
        // inside Fish.js constructor
        this.y = 200 + Math.random() * 4000; // Fish now live between 200px and 4200px deep (below seafloor at 4500)
        this.speed = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
        this.isCaught = false;
        
        this.weight = Math.random() * 5 + 1; // Random weight 1 to 6
        this.baseSpeed = this.speed;
    }

    update() {
        if (!this.isCaught) {
            this.x += this.speed;
            // Screen wrapping
            if (this.x > this.canvasWidth + 50) this.x = -50;
            if (this.x < -50) this.x = this.canvasWidth + 50;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    respawn() {
        this.x = Math.random() * this.canvasWidth;
        this.y = 200 + Math.random() * 4000; // Random depth between 200px and 4200px (below seafloor at 4500)
        this.speed = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
        this.baseSpeed = this.speed;
        this.weight = Math.random() * 5 + 1;
        this.isCaught = false;
    }
}
