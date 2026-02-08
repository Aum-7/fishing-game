export class Fish {
    constructor(canvasWidth, canvasHeight, fishType = 'passive') {
        this.canvasWidth = canvasWidth;
        this.fishType = fishType;
        
        // Set fish properties based on type
        switch(fishType) {
            case 'passive':
                this.width = 30;
                this.height = 20;
                this.speed = (Math.random() * 1 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
                this.color = `hsl(${Math.random() * 60}, 70%, 60%)`; // Light colors
                this.weight = Math.random() * 1 + 0.5;
                this.value = Math.floor(this.weight * 10);
                this.depthMin = 50;
                this.depthMax = 300;
                this.detectionRange = 50; // 50 pixel detection range
                break;
                
            case 'medium':
                this.width = 50;
                this.height = 30;
                this.speed = (Math.random() * 1.5 + 0.8) * (Math.random() > 0.5 ? 1 : -1);
                this.color = `hsl(${20 + Math.random() * 40}, 70%, 50%)`; // Medium colors
                this.weight = Math.random() * 2 + 1.5;
                this.value = Math.floor(this.weight * 15);
                this.depthMin = 200;
                this.depthMax = 800;
                this.detectionRange = 60; // 60 pixel detection range
                break;
                
            case 'large':
                this.width = 80;
                this.height = 40;
                this.speed = (Math.random() * 1 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
                this.color = `hsl(${180 + Math.random() * 60}, 70%, 50%)`; // Blue/green colors
                this.weight = Math.random() * 4 + 3;
                this.value = Math.floor(this.weight * 20);
                this.depthMin = 500;
                this.depthMax = 1500;
                this.detectionRange = 70; // 70 pixel detection range
                break;
                
            case 'predator':
                this.width = 70;
                this.height = 35;
                this.speed = (Math.random() * 2 + 1.2) * (Math.random() > 0.5 ? 1 : -1);
                this.color = `hsl(${300 + Math.random() * 60}, 70%, 50%)`; // Purple/pink colors
                this.weight = Math.random() * 3 + 2;
                this.value = Math.floor(this.weight * 25);
                this.depthMin = 300;
                this.depthMax = 1200;
                this.hunger = Math.random() * 0.5 + 0.3; // Chance to attack bait
                this.detectionRange = 80; // 80 pixel detection range (better at finding bait)
                break;
                
            case 'mega':
                this.width = 150;
                this.height = 70;
                this.speed = (Math.random() * 0.8 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
                this.color = `hsl(${Math.random() * 360}, 80%, 60%)`; // Vibrant colors
                this.weight = Math.random() * 10 + 15;
                this.value = Math.floor(this.weight * 50);
                this.depthMin = 1000;
                this.depthMax = 4000;
                this.stamina = 100; // Resistance to being reeled in
                this.detectionRange = 100; // 100 pixel detection range
                break;
                
            default:
                // Default to passive
                this.width = 30;
                this.height = 20;
                this.speed = (Math.random() * 1 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
                this.color = `hsl(${Math.random() * 60}, 70%, 60%)`;
                this.weight = Math.random() * 1 + 0.5;
                this.value = Math.floor(this.weight * 10);
                this.depthMin = 50;
                this.depthMax = 300;
                this.detectionRange = 50;
        }
        
        // Randomize starting position within depth range
        this.x = Math.random() * canvasWidth;
        this.y = this.depthMin + Math.random() * (this.depthMax - this.depthMin);
        this.baseSpeed = this.speed;
        this.isCaught = false;
        this.caughtByHook = false;
        this.directionChangeTimer = 0;
        
        // Attraction state
        this.attractedToBait = false;
        this.targetX = null;
        this.targetY = null;
        
        // Rotation state
        this.rotation = 0; // Current rotation angle in radians
        this.targetRotation = 0; // Target rotation angle
    }

    update(hookX = null, hookY = null) {
        if (!this.isCaught) {
            // Check if bait/hook is nearby and attract fish if within detection range
            if (hookX !== null && hookY !== null && !this.caughtByHook) {
                // Calculate distance to bait
                const dx = hookX - (this.x + this.width / 2);
                const dy = hookY - (this.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If bait is within detection range, turn and swim toward it
                if (distance < this.detectionRange) {
                    this.attractedToBait = true;
                    this.targetX = hookX;
                    this.targetY = hookY;
                    
                    // Calculate rotation toward bait
                    this.targetRotation = Math.atan2(dy, dx);
                    
                    // Turn toward bait (adjust speed direction)
                    if (dx > 0) {
                        this.speed = Math.abs(this.speed); // Move right
                    } else {
                        this.speed = -Math.abs(this.speed); // Move left
                    }
                    
                    // Move toward bait - swim faster when attracted
                    const speedMultiplier = 1.5;
                    this.x += this.speed * speedMultiplier;
                    
                    // Also move vertically toward bait
                    if (Math.abs(dy) > 5) {
                        this.y += Math.sign(dy) * Math.abs(this.speed) * 0.3 * speedMultiplier;
                    }
                    
                    return; // Skip random swimming when attracted to bait
                } else {
                    // No longer attracted if bait moved out of range
                    this.attractedToBait = false;
                    this.targetX = null;
                    this.targetY = null;
                    // Reset rotation based on swimming direction
                    this.targetRotation = this.speed > 0 ? 0 : Math.PI;
                }
            }
            
            // Normal random swimming behavior
            this.attractedToBait = false;
            
            // Set target rotation based on swimming direction
            this.targetRotation = this.speed > 0 ? 0 : Math.PI;
            
            // Change direction occasionally
            this.directionChangeTimer--;
            if (this.directionChangeTimer <= 0) {
                this.directionChangeTimer = Math.random() * 120 + 60; // Change every 1-2 seconds at 60fps
                
                // Sometimes reverse direction randomly
                if (Math.random() > 0.7) {
                    this.speed *= -1;
                }
            }
            
            this.x += this.speed;
            
            // Screen wrapping
            if (this.x > this.canvasWidth + 50) this.x = -50;
            if (this.x < -50) this.x = this.canvasWidth + 50;
            
            // Stay within depth range
            if (this.y < this.depthMin) this.y = this.depthMin;
            if (this.y > this.depthMax) this.y = this.depthMax;
            
            // Add some vertical movement for more realistic swimming
            if (this.fishType !== 'mega') { // Mega fish move differently
                this.y += Math.sin(Date.now() / 1000 + this.x) * 0.5;
            }
        }
        
        // Smooth rotation interpolation
        this.rotation += (this.targetRotation - this.rotation) * 0.1;
    }

    draw(ctx) {
        ctx.save();
        
        // Translate to fish center and apply rotation
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Draw fish body centered at origin
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Draw eyes to make fish more distinctive
        ctx.fillStyle = 'white';
        const eyeOffset = this.width / 2 - 5;
        ctx.beginPath();
        ctx.arc(eyeOffset, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(eyeOffset + (this.rotation > 0 ? 1 : -1), 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    respawn() {
        this.x = Math.random() * this.canvasWidth;
        this.y = this.depthMin + Math.random() * (this.depthMax - this.depthMin);
        this.speed = (Math.random() * this.baseSpeed + this.baseSpeed/2) * (Math.random() > 0.5 ? 1 : -1);
        this.isCaught = false;
        this.caughtByHook = false;
        this.rotation = 0;
        this.targetRotation = 0;
    }
}