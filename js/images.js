// Create placeholder images dynamically

// Create a boat image
export function createBoatImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 120;
    
    // Draw boat hull
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.beginPath();
    ctx.moveTo(20, 80);
    ctx.lineTo(180, 80);
    ctx.lineTo(160, 120);
    ctx.lineTo(40, 120);
    ctx.closePath();
    ctx.fill();
    
    // Draw boat cabin
    ctx.fillStyle = '#DEB887'; // Tan
    ctx.fillRect(90, 40, 40, 40);
    
    // Draw mast
    ctx.fillStyle = '#654321'; // Dark brown
    ctx.fillRect(108, 20, 4, 20);
    
    // Draw sail
    ctx.fillStyle = '#FFFFFF'; // White
    ctx.beginPath();
    ctx.moveTo(110, 20);
    ctx.lineTo(150, 40);
    ctx.lineTo(110, 60);
    ctx.closePath();
    ctx.fill();
    
    return canvas.toDataURL();
}

// Create a sky image
export function createSkyImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;
    
    // Draw gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#2E1A47"); // Dark purple at top
    gradient.addColorStop(0.5, "#8B4C70"); // Medium purple-pink
    gradient.addColorStop(0.8, "#FFB6C1"); // Light reddish pink at horizon
    gradient.addColorStop(1, "#87CEEB"); // Sky blue for water transition
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sun
    ctx.fillStyle = '#FFFF00'; // Yellow
    ctx.beginPath();
    ctx.arc(100, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawCloud(ctx, 200, 80, 30);
    drawCloud(ctx, 400, 120, 40);
    drawCloud(ctx, 600, 70, 35);
    
    return canvas.toDataURL();
}

function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.6, y, size * 0.9, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y + size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
}