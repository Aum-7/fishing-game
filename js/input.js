export const input = {
    x: window.innerWidth / 2,
    y: 100,
    isDown: false
};

export const boatInput = {
    left: false,
    right: false
};

// Casting system state
export const casting = {
    isCasting: false,
    castPower: 0,
    maxCastDepth: 1000, // Will be updated based on rod
    isFishing: false,
    isReeling: false,
    hasReeled: false, // Track if we've started reeling
    hookAtTarget: false // Track if hook has reached target depth (can only catch fish then)
};

// Handle keyboard input for boat
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        boatInput.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        boatInput.right = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        boatInput.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        boatInput.right = false;
    }
});

const handleInput = (e) => {
    // Prevent default behavior (like scrolling)
    if (e.type.startsWith('touch')) {
        input.x = e.touches[0].clientX;
        input.y = e.touches[0].clientY;
    } else {
        input.x = e.clientX;
        input.y = e.clientY;
    }
};

window.addEventListener('mousedown', () => {
    input.isDown = true;
    
    // Start casting if not already fishing
    if (!casting.isFishing && !casting.isCasting) {
        casting.isCasting = true;
        casting.castPower = 0;
    } 
    // Start reeling if currently fishing
    else if (casting.isFishing && !casting.isReeling) {
        casting.isReeling = true;
        casting.isFishing = false;  // Make mutually exclusive
    }
});

window.addEventListener('mouseup', () => {
    input.isDown = false;
    
    // Complete cast if currently casting
    if (casting.isCasting) {
        casting.isCasting = false;
        casting.isFishing = true;
        casting.hookAtTarget = false; // Hook will start dropping, can't catch yet
    }
    
    // Stop reeling when mouse is released - hook only moves up while holding click
    if (casting.isReeling) {
        casting.isReeling = false;
        casting.isFishing = true; // Keep hook at current depth when reeling stops
    }
});

window.addEventListener('mousemove', handleInput);

window.addEventListener('touchstart', (e) => {
    input.isDown = true;
    handleInput(e);
    
    // Start casting if not already fishing
    if (!casting.isFishing && !casting.isCasting) {
        casting.isCasting = true;
        casting.castPower = 0;
    } 
    // Start reeling if currently fishing
    else if (casting.isFishing && !casting.isReeling) {
        casting.isReeling = true;
    }
}, { passive: false });

window.addEventListener('touchend', () => {
    input.isDown = false;
    
    // Complete cast if currently casting
    if (casting.isCasting) {
        casting.isCasting = false;
        casting.isFishing = true;
        casting.hookAtTarget = false; // Hook will start dropping, can't catch yet
    }
    
    // Stop reeling when touch ends - hook only moves up while holding click
    if (casting.isReeling) {
        casting.isReeling = false;
        casting.isFishing = true; // Keep hook at current depth when reeling stops
    }
});
window.addEventListener('touchmove', handleInput, { passive: false });
