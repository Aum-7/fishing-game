import { Fish } from './Fish.js';
import { input, boatInput, casting } from './input.js';
import { checkCollision, applyPhysics } from './physics.js';

let cameraY = 0;
let waveOffset = 0; // For wave animation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load boat image
const boatImage = new Image();
boatImage.src = 'assets/Boat1.png';
const boatImageLoaded = false;

// Load sky image
const skyImage = new Image();
skyImage.src = 'assets/Sky1.png';
let skyImageLoaded = false;
skyImage.onload = () => {
    skyImageLoaded = true;
    console.log("Sky image loaded successfully");
};

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Update boat position to stay centered
    boat.x = canvas.width / 2;
});

// Boat settings
const boat = {
    x: canvas.width / 2,
    y: 0,
    width: 200,  // Doubled from 100 to 200
    height: 120,  // Doubled from 60 to 120
    speed: 5
};

const seaFloorY = 4500; // Seafloor depth limit

let gold = 0;
const fishes = Array.from({ length: 20 }, () => new Fish(canvas.width, canvas.height));
const hook = { x: canvas.width / 2, y: 50 };

function update() {
    // Update wave animation
    waveOffset += 0.05; // Wave animation speed
    
    // Update boat position based on input (only when not casting or reeling)
    if (!casting.isCasting && !casting.isFishing && !casting.isReeling) {
        if (boatInput.left) {
            boat.x -= boat.speed;
        }
        if (boatInput.right) {
            boat.x += boat.speed;
        }
        // Keep boat within screen bounds
        boat.x = Math.max(boat.width / 2, Math.min(canvas.width - boat.width / 2, boat.x));
    }
    
    // Apply wave motion to boat Y position
    // Boat bobs up and down on the waves
    boat.y = Math.sin(waveOffset) * 5; // ±5 pixels of wave motion

    // Handle casting power - increase while holding (but hook stays at boat)
    if (casting.isCasting) {
        casting.castPower = Math.min(casting.castPower + 30, casting.maxCastDepth);
        // Hook stays at boat while charging
        hook.x = boat.x;
        hook.y = 50;
    }

    // Handle reeling in - move hook up while holding click
    if (casting.isReeling) {
        casting.hasReeled = true; // Mark that we've started reeling
        hook.y -= 20;
        
        // Keep hook following boat horizontally
        hook.x = boat.x;
        
// Check if hook reached surface
        if (hook.y <= 50) {
            // Collect fish and reset
            fishes.forEach(fish => {
                if (fish.isCaught) {
                    gold += Math.floor(fish.weight * 10);
                    fish.respawn();
                }
            });
            
            // Reset casting state
            hook.y = 50;
            casting.isFishing = false;
            casting.isReeling = false;
            casting.hasReeled = false; // Reset the hasReeled flag
        }
    }
    // Handle hook dropping after cast release (only if we haven't started reeling yet)
    else if (casting.isFishing && !casting.hasReeled && hook.y < casting.castPower) {
        // Hook is still dropping to target depth
        hook.y += 40; // Fast drop speed
        hook.x = boat.x;
    }
    // Handle active fishing (hook stationary at cast depth or after reeling)
    else if (casting.isFishing && (hook.y >= casting.castPower || casting.hasReeled)) {
        // Hook has reached target depth or we've already reeled - stay stationary
        // Fish can still be caught by collision
        // Keep hook following boat horizontally
        hook.x = boat.x;
    }
    // Normal mode - hook follows boat when not fishing
    else {
        hook.x = boat.x;
        hook.y = 50;
    }

    // Limit hook depth - don't let it go beyond the seafloor
    if (hook.y > seaFloorY) {
        hook.y = seaFloorY;
    }

    // Only apply mouse physics when not casting/fishing/reeling
    if (!casting.isCasting && !casting.isFishing && !casting.isReeling) {
        const worldInput = { x: input.x, y: input.y + cameraY };
        applyPhysics(hook, worldInput);
    }

    fishes.forEach(fish => {
        // Update fish movement
        fish.update();
        
        // Check collision with hook (only when stationary)
        if (!fish.isCaught && checkCollision(hook, fish) && casting.isFishing) {
            fish.isCaught = true;
            console.log("Fish caught!");
        }
        
        if (fish.isCaught) {
            // Make the fish follow the hook
            fish.x = hook.x - fish.width / 2;
            fish.y = hook.y;
        }
    });
}

function draw() {
    // 1. Clear the screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Calculate Camera Position based on hook
    // Default camera position: show more sky, less water
    const defaultViewOffset = canvas.height / 1.5; // Larger value = more negative cameraY = more sky
    let targetCameraY = -defaultViewOffset; // Start with default view (negative = above water surface)
    
    // Only move camera down when hook goes below the default view
    const hookThreshold = -defaultViewOffset + canvas.height / 2;
    if (hook.y > hookThreshold) {
        targetCameraY = hook.y - canvas.height / 2;
    }
    
    // Smooth camera movement - faster following
    cameraY += (targetCameraY - cameraY) * 0.2;

    // 3. Start "World Space" drawing
    ctx.save();
    ctx.translate(0, -cameraY);

// --- DRAW SKY ---
    // Use sky image if loaded, otherwise fallback to gradient
    if (skyImageLoaded && skyImage.complete && skyImage.naturalWidth !== 0) {
        // Cut off the water portion at the bottom of the sky image
        const waterCutoff = 158; // Cut off bottom 158px of image (water area)
        
// Draw the sky portion of the image, aligned with horizon at y=0
        // Lowered by 25 pixels to show more sky
        ctx.drawImage(
            skyImage, 
            0, 0, skyImage.naturalWidth, skyImage.naturalHeight - waterCutoff, // Source: exclude bottom water
            0, -(skyImage.naturalHeight - waterCutoff) + 25, canvas.width, skyImage.naturalHeight - waterCutoff // Dest: bottom at y=0, lowered 25px
        );
} else {
        // Fallback sky gradient
        const skyGradient = ctx.createLinearGradient(0, -2000, 0, 50);
        skyGradient.addColorStop(0, "#2E1A47"); // Dark purple at top
        skyGradient.addColorStop(0.5, "#8B4C70"); // Medium purple-pink
        skyGradient.addColorStop(1, "#FFB6C1"); // Light reddish pink at horizon (near water)
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, -2000, canvas.width, 2200);
    }

    // --- DRAW WATER ---
    // Water starts at y=0 and extends below seafloor
    const waterGradient = ctx.createLinearGradient(0, 0, 0, seaFloorY + 500);
    waterGradient.addColorStop(0, "#4FC3F7"); // Light blue at surface
    waterGradient.addColorStop(0.1, "#0288D1"); // Deeper blue
    waterGradient.addColorStop(1, "#00010d"); // Dark at bottom
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 0, canvas.width, seaFloorY + 500);

    // Draw animated waves on surface
    ctx.fillStyle = "#87CEEB"; // Lighter wave color
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= canvas.width; x += 20) {
        const waveY = Math.sin((x / 50) + waveOffset) * 8;
        ctx.lineTo(x, waveY);
    }
    ctx.lineTo(canvas.width, 0);
    ctx.closePath();
    ctx.fill();

    // Draw Seafloor - dark color
    ctx.fillStyle = "#0a0a14"; // Very dark color for underwater seafloor
    ctx.fillRect(0, seaFloorY, canvas.width, 500);

    // Draw Boat using image
    if (boatImage.complete && boatImage.naturalWidth !== 0) {
        // Draw the boat image centered at boat position
        ctx.drawImage(boatImage, boat.x - boat.width / 2, boat.y - boat.height / 2, boat.width, boat.height);
    } else {
        // Fallback to drawn boat if image not loaded
        ctx.fillStyle = "#8B4513"; // Brown hull
        ctx.fillRect(boat.x - boat.width / 2, boat.y - boat.height / 2, boat.width, boat.height);
        
        // Draw boat cabin
        ctx.fillStyle = "#DEB887";
        ctx.fillRect(boat.x - 15, boat.y - boat.height / 2 - 15, 30, 15);
        
        // Draw mast
        ctx.fillStyle = "#654321";
        ctx.fillRect(boat.x - 2, boat.y - boat.height / 2 - 35, 4, 20);
    }

    // Draw the Fishing Line and Hook (only when casting, fishing, or reeling)
    if (casting.isCasting || casting.isFishing || casting.isReeling) {
        // Draw line from boat to hook
        ctx.beginPath();
        ctx.moveTo(boat.x, boat.y);
        ctx.lineTo(hook.x, hook.y);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Hook
        ctx.fillStyle = "silver";
        ctx.fillRect(hook.x - 5, hook.y, 10, 15);
    }

    // Draw Fishes
    fishes.forEach(fish => fish.draw(ctx));

    // --- END WORLD SPACE ---
    ctx.restore();

    // 4. Draw UI (Always stays fixed to the screen)
    
    // Draw casting power bar
    if (casting.isCasting) {
        const barWidth = 300;
        const barHeight = 30;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 100;
        
        // Background bar
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Power indicator
        const powerPercent = casting.castPower / casting.maxCastDepth;
        const powerWidth = barWidth * powerPercent;
        
        // Gradient for power bar
        const powerGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        powerGradient.addColorStop(0, "#4CAF50"); // Green at low power
        powerGradient.addColorStop(0.5, "#FFC107"); // Yellow at medium
        powerGradient.addColorStop(1, "#F44336"); // Red at max power
        
        ctx.fillStyle = powerGradient;
        ctx.fillRect(barX, barY, powerWidth, barHeight);
        
        // Border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Text label
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Hold to Cast - Release to Throw!", canvas.width / 2, barY - 10);
        ctx.fillText(`Depth: ${Math.round(casting.castPower)}px`, canvas.width / 2, barY + barHeight + 20);
    }
    
    // Draw reel instruction
    if (casting.isFishing) {
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Click to Reel In!", canvas.width / 2, canvas.height - 50);
    }
    
    // Draw current gold
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Gold: ${gold}`, 20, 40);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
