export function checkCollision(hook, fish) {
    // Simple AABB Collision
    return (
        hook.x < fish.x + fish.width &&
        hook.x + 10 > fish.x && // 10 is hook width
        hook.y < fish.y + fish.height &&
        hook.y + 15 > fish.y    // 15 is hook height
    );
}

export function applyPhysics(hook, targetInput, lerpFactor = 0.1) {
    // This creates a smooth "lagging" follow effect
    hook.x += (targetInput.x - hook.x) * lerpFactor;
    hook.y += (targetInput.y - hook.y) * lerpFactor;
}