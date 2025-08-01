document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-btn');
  const gameContainer = document.getElementById('game-container');
  const canvas = document.getElementById('maze-canvas');
  const ctx = canvas.getContext('2d');
  const winModal = document.getElementById('win-modal');
  const memoriesBtn = document.getElementById('memories-btn');
  const galleryModal = document.getElementById('gallery-modal');
  const closeGallery = document.getElementById('close-gallery');
  const bgMusic = document.getElementById('bg-music');

  // --- Flowing Hearts Background ---
  const bgCanvas = document.getElementById('bg-hearts');
  const bgCtx = bgCanvas.getContext('2d');
  let hearts = [];
  function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeBgCanvas);
  resizeBgCanvas();

  function randomHeart() {
    return {
      x: Math.random() * bgCanvas.width,
      y: bgCanvas.height + 20,
      size: 16 + Math.random() * 16,
      speed: 0.5 + Math.random() * 1,
      alpha: 0.6 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 0.5
    };
  }
  function drawHeart(ctx, x, y, size, color, alpha=1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    let topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(
      x, y, 
      x - size / 2, y, 
      x - size / 2, y + topCurveHeight
    );
    ctx.bezierCurveTo(
      x - size / 2, y + (size + topCurveHeight) / 2,
      x, y + (size + topCurveHeight) / 1.2,
      x, y + size
    );
    ctx.bezierCurveTo(
      x, y + (size + topCurveHeight) / 1.2,
      x + size / 2, y + (size + topCurveHeight) / 2,
      x + size / 2, y + topCurveHeight
    );
    ctx.bezierCurveTo(
      x + size / 2, y, 
      x, y, 
      x, y + topCurveHeight
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
  function animateBgHearts() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    // Add new hearts
    if (hearts.length < 30 && Math.random() < 0.2) {
      hearts.push(randomHeart());
    }
    // Animate
    hearts.forEach(h => {
      h.y -= h.speed;
      h.x += h.drift;
      drawHeart(bgCtx, h.x, h.y, h.size, '#ff69b4', h.alpha);
    });
    // Remove offscreen
    hearts = hearts.filter(h => h.y + h.size > 0);
    // Draw mouse trail hearts
    mouseTrail.forEach(ht => {
      drawHeart(bgCtx, ht.x, ht.y, ht.size, '#ff1493', ht.alpha);
    });
    // Fade and remove mouse trail hearts
    for (let i = mouseTrail.length - 1; i >= 0; i--) {
      mouseTrail[i].alpha -= 0.03;
      mouseTrail[i].y -= 0.5;
      if (mouseTrail[i].alpha <= 0) mouseTrail.splice(i, 1);
    }
    requestAnimationFrame(animateBgHearts);
  }
  // --- Mouse Heart Trail ---
  let mouseTrail = [];
  bgCanvas.addEventListener('mousemove', e => {
    const rect = bgCanvas.getBoundingClientRect();
    mouseTrail.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      size: 12 + Math.random() * 6,
      alpha: 1
    });
  });
  // Also listen on document for mousemove
  document.addEventListener('mousemove', e => {
    const rect = bgCanvas.getBoundingClientRect();
    mouseTrail.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      size: 12 + Math.random() * 6,
      alpha: 1
    });
  });
  animateBgHearts();

  // --- Maze Game ---
  const mazeWidth = 25;
  const mazeHeight = 25;
  
  // Calculate sizes first
  function calculateSizes() {
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    
    // Calculate tile size that will fit both dimensions
    const tileSize = Math.floor(Math.min(
      maxWidth / mazeWidth,
      maxHeight / mazeHeight
    ));
    
    // Adjust these multipliers to change relative sizes
    const spriteSize = Math.floor(tileSize * 1.8); // Smaller sprite that fits within tile
    const heartSize = Math.floor(tileSize * 1.2); // Slightly bigger heart
    
    return { tileSize, spriteSize, heartSize };
  }

  // Get initial sizes
  const { tileSize, spriteSize, heartSize } = calculateSizes();
  
  // Set canvas size
  canvas.width = mazeWidth * tileSize;
  canvas.height = mazeHeight * tileSize;

  let maze = [];
  let goal = { x: mazeWidth - 2, y: mazeHeight - 2 };

  // randomized maze using Recursive Backtracking
  function generateMaze(width, height) {
    // Initialize maze: 1 = wall, 0 = path
    let m = Array.from({ length: height }, () => Array(width).fill(1));
    function carve(x, y) {
      const dirs = [
        [0, -2], [2, 0], [0, 2], [-2, 0]
      ].sort(() => Math.random() - 0.5);
      m[y][x] = 0;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (ny > 0 && ny < height && nx > 0 && nx < width && m[ny][nx] === 1) {
          m[y + dy / 2][x + dx / 2] = 0;
          carve(nx, ny);
        }
      }
    }
    carve(1, 1);
    // Set goal
    m[goal.y][goal.x] = 2;
    // Ensure start and goal are open
    m[1][1] = 0;
    return m;
  }

  let player = { x: 1, y: 1 };
  let spriteImg = new Image();
  spriteImg.src = 'Images/sprite.png';
  let heartImg = new Image();
  heartImg.src = 'Images/heart.png';

  
  function drawMaze() {
    const { heartSize } = calculateSizes();
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        // floor
        ctx.fillStyle = '#222';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        // wall
        if (maze[y][x] === 1) {
          ctx.fillStyle = '#ff69b4';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
        // goal
        if (maze[y][x] === 2) {
          ctx.drawImage(heartImg, 
            x * tileSize + (tileSize - heartSize) / 2, 
            y * tileSize + (tileSize - heartSize) / 2, 
            heartSize, heartSize);
        }
      }
    }
  }

  function drawPlayer() {
    // Enable image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate position to center sprite in tile
    const x = player.x * tileSize + (tileSize - spriteSize) / 2;
    const y = player.y * tileSize + (tileSize - spriteSize) / 2;

    // Draw the sprite centered in the tile and scaled to spriteSize
    ctx.drawImage(
      spriteImg,
      x,
      y,
      spriteSize,
      spriteSize
    );
  }

  function render() {
    drawMaze();
    drawPlayer();
  }

  function canMove(x, y) {
    return maze[y] && maze[y][x] !== undefined && maze[y][x] !== 1;
  }

  function checkWin() {
    if (maze[player.y][player.x] === 2) {
      document.body.classList.add('modal-open');
      winModal.style.display = 'flex';
      winModal.style.position = 'fixed';
      winModal.style.zIndex = '2000';
      winModal.querySelector('.modal-content').style.animation = 'modalPop 0.3s ease-out';
      window.removeEventListener('keydown', handleKey); // Prevent moving after win
      // Removed bgMusic.pause() so music continues playing
    }
  }

  function resetGame() {
    player = { x: 1, y: 1 };
    maze = generateMaze(mazeWidth, mazeHeight);
    render();
  }

  // Controls
  function handleKey(e) {
    let moved = false;
    // Add skip functionality
    if (e.key.toLowerCase() === 'z') {
      // Skip to win state (without pausing music)
      document.body.classList.add('modal-open');
      winModal.style.display = 'flex';
      winModal.style.position = 'fixed';
      winModal.style.zIndex = '2000';
      winModal.querySelector('.modal-content').style.animation = 'modalPop 0.3s ease-out';
      window.removeEventListener('keydown', handleKey);
      return;
    }
    // Add volume controls
    if (e.key === '+' || e.key === '=') {
      bgMusic.volume = Math.min(1, bgMusic.volume + 0.05);
      return;
    }
    if (e.key === '-') {
      bgMusic.volume = Math.max(0, bgMusic.volume - 0.05);
      return;
    }
    
    if (e.key === 'ArrowUp') {
      if (canMove(player.x, player.y - 1)) { player.y--; moved = true; }
    } else if (e.key === 'ArrowDown') {
      if (canMove(player.x, player.y + 1)) { player.y++; moved = true; }
    } else if (e.key === 'ArrowLeft') {
      if (canMove(player.x - 1, player.y)) { player.x--; moved = true; }
    } else if (e.key === 'ArrowRight') {
      if (canMove(player.x + 1, player.y)) { player.x++; moved = true; }
    }
    if (moved) {
      render();
      checkWin();
    }
  }

  // Event Listeners
  startBtn.onclick = () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    resetGame();
    bgMusic.volume = 0.05; // Lower volume to 15%
    bgMusic.currentTime = 0;
    bgMusic.loop = true;
    bgMusic.play();
    window.addEventListener('keydown', handleKey);
  };

  memoriesBtn.onclick = () => {
    winModal.style.display = 'none';
    galleryModal.style.display = 'flex';
    galleryModal.style.position = 'fixed';  
    galleryModal.style.zIndex = '2000';     
    galleryModal.querySelector('.modal-content').style.animation = 'modalPop 0.3s ease-out';
  };

  closeGallery.onclick = () => {
    galleryModal.style.display = 'none';
    document.body.classList.remove('modal-open');
  };


  window.addEventListener("keydown", function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  }, false);

 
  spriteImg.onload = heartImg.onload = function() {
    maze = generateMaze(mazeWidth, mazeHeight);
    render();
  };

  // Add touch controls
  let touchStartX = 0;
  let touchStartY = 0;
  const minSwipeDistance = 30;

  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, false);

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);

  document.addEventListener('touchend', function(e) {
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;
    
    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;

    // Determine swipe direction
    if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          if (canMove(player.x + 1, player.y)) { player.x++; render(); checkWin(); }
        } else {
          if (canMove(player.x - 1, player.y)) { player.x--; render(); checkWin(); }
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          if (canMove(player.x, player.y + 1)) { player.y++; render(); checkWin(); }
        } else {
          if (canMove(player.x, player.y - 1)) { player.y--; render(); checkWin(); }
        }
      }
    }
  }, false);

  // Handle resize
  window.addEventListener('resize', function() {
    const { tileSize, spriteSize } = calculateSizes();
    canvas.width = mazeWidth * tileSize;
    canvas.height = mazeHeight * tileSize;
    render();
  });
});