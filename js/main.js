import { Fish } from './Fish.js';
import { input, boatInput, casting } from './input.js';
import { checkCollision, applyPhysics } from './physics.js';

let cameraY = 0;
let waveOffset = 0; // For wave animation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Get UI elements
const goldDisplay = document.getElementById('gold-display');
const rodDisplay = document.getElementById('rod-display');
const baitDisplay = document.getElementById('bait-display');
const inventoryDisplay = document.getElementById('inventory-display');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Boat settings - moved before resize handler
const boat = {
    x: canvas.width / 2,
    y: 0,
    width: 200,  // Doubled from 100 to 200
    height: 120,  // Doubled from 60 to 120
    speed: 5
};

// Load boat image from assets
const boatImage = new Image();
boatImage.src = 'assets/Boat1.png';
let boatImageLoaded = false;

// Load sky image from assets
const skyImage = new Image();
skyImage.src = 'assets/Sky1.png';
let skyImageLoaded = false;

// Set loaded flags when images finish loading
boatImage.onload = () => {
    boatImageLoaded = true;
    console.log("Boat image loaded successfully");
};

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

// Rod upgrade system
const rodTypes = [
    { name: 'Basic Rod', cost: 0, strength: 10, castDistance: 1000 },
    { name: 'Reinforced Rod', cost: 500, strength: 20, castDistance: 1500 },
    { name: 'Pro Rod', cost: 1500, strength: 35, castDistance: 2500 },
    { name: 'Champion Rod', cost: 5000, strength: 50, castDistance: 4000 }
];

let currentRodIndex = 0;
let gold = 100; // Starting gold
let currentBait = 'small'; // Player starts with small bait
let inventory = {
    'small': 5,
    'medium': 0,
    'large': 0
};

// Initialize casting max depth based on current rod after everything is defined
casting.maxCastDepth = rodTypes[currentRodIndex].castDistance;

// Bait types and costs
const baitTypes = {
    'small': { name: 'Small Bait', cost: 10 },
    'medium': { name: 'Medium Bait', cost: 30 },
    'large': { name: 'Large Bait', cost: 80 }
};

const seaFloorY = 4500; // Seafloor depth limit

// Initialize fishes with different types
const fishTypes = ['passive', 'medium', 'large', 'predator', 'mega'];
let fishes = [];

// Generate initial fish population
for (let i = 0; i < 20; i++) {
    const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    fishes.push(new Fish(canvas.width, canvas.height, type));
}

const hook = { 
    x: canvas.width / 2, 
    y: 50,
    strength: rodTypes[currentRodIndex].strength,
    vx: 0,  // Horizontal velocity for physics
    vy: 0   // Vertical velocity for physics
};

// Upgrade slots for the rod
let rodUpgrades = {
    sink: null,
    float: null,
    attractant: null
};

function buyRod() {
    if (currentRodIndex < rodTypes.length - 1) {
        const nextRod = rodTypes[currentRodIndex + 1];
        if (gold >= nextRod.cost) {
            gold -= nextRod.cost;
            currentRodIndex++;
            hook.strength = rodTypes[currentRodIndex].strength;
            casting.maxCastDepth = rodTypes[currentRodIndex].castDistance;  // Update the casting max depth
            updateUI();
            console.log(`Upgraded to ${nextRod.name}`);
        } else {
            console.log(`Not enough gold to buy ${nextRod.name}. Need ${nextRod.cost - gold} more.`);
        }
    } else {
        console.log("Already have the best rod!");
    }
}

function buyBait(type) {
    const bait = baitTypes[type];
    if (gold >= bait.cost) {
        gold -= bait.cost;
        inventory[type]++;
        updateUI();
        console.log(`Bought ${bait.name}`);
    } else {
        console.log(`Not enough gold to buy ${bait.name}. Need ${bait.cost - gold} more.`);
    }
}

function updateUI() {
    // Update UI elements
    if (goldDisplay) goldDisplay.textContent = gold;
    if (rodDisplay) rodDisplay.textContent = rodTypes[currentRodIndex].name;
    if (baitDisplay) baitDisplay.textContent = baitTypes[currentBait].name;
    if (inventoryDisplay) inventoryDisplay.textContent = 
        `Small: ${inventory.small}, Medium: ${inventory.medium}, Large: ${inventory.large}`;
}

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
        casting.castPower = Math.min(casting.castPower + 30, rodTypes[currentRodIndex].castDistance);
        // Apply upgrades that affect casting
        if (rodUpgrades.sink) {
            // Sinks make the hook drop faster
            casting.castPower = Math.min(casting.castPower + 50, rodTypes[currentRodIndex].castDistance);
        }
        
        // Hook stays at boat while charging
        hook.x = boat.x;
        hook.y = 50;
    }

    // Handle reeling in - move hook up while holding click
    if (casting.isReeling) {
        casting.hasReeled = true; // Mark that we've started reeling
        
        // Check if any fish is pulling against the rod
        let fishResistance = 0;
        fishes.forEach(fish => {
            if (fish.caughtByHook) {
                if (fish.fishType === 'mega') {
                    // Mega fish offer significant resistance
                    fishResistance += 15;
                } else if (fish.fishType === 'large' || fish.fishType === 'predator') {
                    // Large and predator fish offer moderate resistance
                    fishResistance += 8;
                } else {
                    // Smaller fish offer little resistance
                    fishResistance += 3;
                }
            }
        });
        
        // Calculate if the rod can handle the fish
        if (hook.strength >= fishResistance) {
            hook.y -= 20 - (fishResistance * 0.3); // Faster reeling with stronger rod
        } else {
            // Rod breaks or fish gets away
            console.log("Fish got away! Upgrade your rod strength.");
            fishes.forEach(fish => {
                if (fish.caughtByHook) {
                    fish.caughtByHook = false;
                    fish.isCaught = false;
                }
            });
        }
        
        // Keep hook following boat horizontally
        hook.x = boat.x;
        
        // Check if hook reached surface
        if (hook.y <= 50) {
            // Collect fish and reset
            let fishCaught = false;
            fishes.forEach(fish => {
                if (fish.isCaught) {
                    gold += fish.value;
                    fishCaught = true;
                    
                    // If the fish can be used as bait, add to inventory
                    if (fish.fishType === 'passive') {
                        inventory.small++;
                        console.log("Got small bait fish!");
                    } else if (fish.fishType === 'medium') {
                        inventory.medium++;
                        console.log("Got medium bait fish!");
                    } else if (fish.fishType === 'large') {
                        inventory.large++;
                        console.log("Got large bait fish!");
                    }
                    
                    fish.respawn();
                }
            });
            
            if (fishCaught) {
                console.log("Successfully caught fish!");
            }
            
            // Reset casting state
            hook.y = 50;
            casting.isFishing = false;
            casting.isReeling = false;
            casting.hasReeled = false; // Reset the hasReeled flag
            
            updateUI();
        }
    }
    // Handle hook dropping after cast release (only if we haven't started reeling yet)
    else if (casting.isFishing && !casting.hasReeled && hook.y < casting.castPower) {
        // Apply upgrades that affect dropping speed
        let dropSpeed = 40;
        if (rodUpgrades.sink) {
            dropSpeed += 20; // Sinks make the hook drop faster
        } else if (rodUpgrades.float) {
            dropSpeed -= 20; // Floats make the hook drop slower
        }
        
        // Hook is still dropping to target depth
        hook.y += dropSpeed;
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
        
        // Check collision with hook (only when stationary or reeling and bait available)
        if (!fish.isCaught && 
            checkCollision(hook, fish) && 
            (casting.isFishing || casting.isReeling) && 
            inventory[currentBait] > 0) {
            
            // Determine if this fish can be caught with current bait
            let canCatch = false;
            switch(currentBait) {
                case 'small':
                    // Small bait catches passive fish
                    canCatch = fish.fishType === 'passive';
                    break;
                case 'medium':
                    // Medium bait catches passive and medium fish
                    canCatch = fish.fishType === 'passive' || fish.fishType === 'medium';
                    break;
                case 'large':
                    // Large bait catches all except mega fish
                    canCatch = fish.fishType !== 'mega';
                    break;
            }
            
            if (canCatch) {
                fish.isCaught = true;
                fish.caughtByHook = true;
                console.log(`${fish.fishType} fish caught with ${currentBait} bait!`);
                
                // Use up the bait
                inventory[currentBait]--;
                updateUI();
            } else {
                console.log(`Can't catch ${fish.fishType} fish with ${currentBait} bait!`);
            }
        }
        
        if (fish.isCaught) {
            // Make the fish follow the hook
            fish.x = hook.x - fish.width / 2;
            fish.y = hook.y;
        }
        
        // Handle predator fish behavior
        if (fish.fishType === 'predator' && !fish.isCaught) {
            // Predators might steal bait from other fish (only if not already caught)
            fishes.forEach(otherFish => {
                if (otherFish.caughtByHook && !otherFish.isCaught && otherFish !== fish && Math.random() < fish.hunger) {
                    otherFish.caughtByHook = false;
                    otherFish.isCaught = false;
                    console.log("Predator fish stole your catch!");
                }
            });
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
    if (boatImageLoaded && boatImage.complete && boatImage.naturalWidth !== 0) {
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

        // Draw Hook with bait
        ctx.fillStyle = "silver";
        ctx.fillRect(hook.x - 5, hook.y, 10, 15);
        
        // Draw bait based on current bait type
        switch(currentBait) {
            case 'small':
                ctx.fillStyle = '#FFD700'; // Gold for small bait
                break;
            case 'medium':
                ctx.fillStyle = '#FF8C00'; // Orange for medium bait
                break;
            case 'large':
                ctx.fillStyle = '#DC143C'; // Crimson for large bait
                break;
        }
        ctx.beginPath();
        ctx.arc(hook.x, hook.y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
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
        const powerPercent = casting.castPower / rodTypes[currentRodIndex].castDistance;
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
}

// Handle key presses for upgrades and bait selection
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        buyRod();
    } else if (e.key === 'b' || e.key === 'B') {
        // Cycle through bait types
        if (inventory.medium > 0) {
            currentBait = 'medium';
        } else if (inventory.large > 0) {
            currentBait = 'large';
        } else {
            currentBait = 'small';
        }
        updateUI();
    }
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Initial UI update
updateUI();

loop();