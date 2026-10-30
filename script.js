/* Attack of Hunger — sprite rendering, sound synthesis and browser controls.
 * Character sprites are user-provided assets; scenery/UI are drawn in Canvas.
 * No frameworks or runtime dependencies.
 */
(function () {
  'use strict';

  const { HungerEngine, clamp, PLAYER_HEIGHT, PLAYER_FEET_OFFSET } = window.HungerGame;
  const TAU = Math.PI * 2;
  const INK = '#293d2d';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function ellipse(ctx, x, y, rx, ry, fill, stroke, lineWidth = 2) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function polygon(ctx, points, fill, stroke = INK, lineWidth = 2.5) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function line(ctx, points, color = INK, width = 2) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function roundedRect(ctx, x, y, width, height, radius, fill, stroke, lineWidth = 2) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function seededRandom(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  class SpriteBank {
    constructor(manifest) {
      this.frames = (manifest && manifest.frames) || {};
      this.image = new Image();
      this.ready = false;
      this.failed = false;
      this.onLoad = null;
      if (manifest && manifest.src) {
        this.image.onload = () => {
          this.ready = true;
          if (this.onLoad) this.onLoad();
        };
        this.image.onerror = () => {
          this.failed = true;
          console.error('[Attack of Hunger] Não foi possível carregar assets/sprites.png. Usando fallback visual.');
        };
        this.image.src = manifest.src;
      }
    }

    frame(name) { return this.ready ? this.frames[name] : null; }

    draw(ctx, name, x, y, width, height) {
      const frame = this.frame(name);
      if (!frame) return false;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, x, y, width, height);
      return true;
    }
  }

  const spriteBank = new SpriteBank(window.HungerSprites);

  function drawTargetBadge(ctx, x, y, scale) {
    ellipse(ctx, x, y, 8 * scale, 8 * scale, '#fff4d5', '#4e7147', 1.4 * scale);
    line(ctx, [[x - 3 * scale, y], [x + 3 * scale, y]], '#42663d', 1.8 * scale);
    line(ctx, [[x, y - 3 * scale], [x, y + 3 * scale]], '#42663d', 1.8 * scale);
  }

  function drawDangerBadge(ctx, x, y, scale) {
    polygon(ctx, [[x, y - 9 * scale], [x + 9 * scale, y], [x, y + 9 * scale], [x - 9 * scale, y]], '#f4c18a', '#9c5438', 1.4 * scale);
    line(ctx, [[x, y - 4 * scale], [x, y + 1 * scale]], '#8c482f', 2 * scale);
    ellipse(ctx, x, y + 4 * scale, 1 * scale, 1 * scale, '#8c482f');
  }

  function drawHuman(ctx, x, y, variant = 0, time = 0, scale = 1, badge = true) {
    const index = ((Math.floor(variant) % 7) + 7) % 7;
    const name = 'human_' + index;
    const frame = spriteBank.frame(name);
    if (frame) {
      const height = 66 * scale;
      const width = height * frame.w / frame.h;
      ctx.save();
      ctx.translate(x, y);
      if (!reducedMotion.matches) ctx.rotate(Math.sin(time * 5) * 0.035);
      spriteBank.draw(ctx, name, -width / 2, -height / 2, width, height);
      ctx.restore();
      if (badge) drawTargetBadge(ctx, x, y - height / 2 - 11 * scale, scale);
      return;
    }
    drawHumanFallback(ctx, x, y, variant, time, scale, badge);
  }

  function drawHumanFallback(ctx, x, y, variant = 0, time = 0, scale = 1, badge = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const stride = Math.sin(time * 9) * 3;
    const skin = ['#efbf91', '#c88f65', '#f1cbae'][variant % 3];
    const hair = ['#654b35', '#3d3b2c', '#c69b50'][variant % 3];
    ctx.rotate(Math.sin(time * 5) * 0.055);
    // Tiny scout: green cape, harness and two silver training blades.
    polygon(ctx, [[-8,-8],[-17,15 + stride],[-3,12],[5,17],[15,12 - stride],[8,-8]], '#4d7252', INK, 2);
    line(ctx, [[-6,-3],[-10,10]], '#86a16c', 1.5);
    line(ctx, [[6,-3],[10,10]], '#86a16c', 1.5);
    line(ctx, [[-5,10],[-6 - stride,23]], '#554938', 5);
    line(ctx, [[5,10],[6 + stride,23]], '#554938', 5);
    line(ctx, [[-6 - stride,23],[-9 - stride,24]], '#30382b', 4);
    line(ctx, [[6 + stride,23],[9 + stride,24]], '#30382b', 4);
    roundedRect(ctx, -8, -8, 16, 22, 4, '#e8d9ad', INK, 1.8);
    line(ctx, [[-6,-5],[5,10]], '#866846', 2);
    line(ctx, [[6,-5],[-5,10]], '#866846', 2);
    roundedRect(ctx, -9, 7, 18, 4, 1, '#806346', null);
    line(ctx, [[-9,-4],[-13,5 + stride]], skin, 4);
    line(ctx, [[9,-4],[13,4 - stride]], skin, 4);
    line(ctx, [[-14,5 + stride],[-20,15 + stride]], '#dce6d4', 2.5);
    line(ctx, [[14,4 - stride],[20,14 - stride]], '#dce6d4', 2.5);
    line(ctx, [[-13,4 + stride],[-17,2 + stride]], '#725e40', 2);
    line(ctx, [[13,3 - stride],[17,1 - stride]], '#725e40', 2);
    ellipse(ctx, 0, -17, 8, 9, skin, INK, 1.8);
    polygon(ctx, [[-8,-17],[-9,-24],[-4,-28],[3,-27],[8,-23],[8,-17],[3,-21],[-2,-19],[-4,-22]], hair, INK, 1.5);
    ellipse(ctx, -3, -16, 0.9, 1.2, INK);
    ellipse(ctx, 3, -16, 0.9, 1.2, INK);
    line(ctx, [[-1,-12],[2,-12]], '#a56b4c', 1);
    if (badge) {
      ellipse(ctx, 0, -39, 8, 8, '#fff4d5', '#4e7147', 1.4);
      line(ctx, [[-3,-39],[3,-39]], '#42663d', 1.8);
      line(ctx, [[0,-42],[0,-36]], '#42663d', 1.8);
    }
    ctx.restore();
  }

  function drawEnemy(ctx, x, y, time = 0, scale = 1, badge = true, variant = 0) {
    const index = ((Math.floor(variant) % 2) + 2) % 2;
    const name = index === 0 ? 'rival_beast' : 'rival_armored';
    const frame = spriteBank.frame(name);
    if (frame) {
      const height = (index === 0 ? 116 : 120) * scale;
      const width = height * frame.w / frame.h;
      ctx.save();
      ctx.translate(x, y);
      if (!reducedMotion.matches) ctx.rotate(Math.sin(time * 4) * 0.04);
      spriteBank.draw(ctx, name, -width / 2, -height / 2, width, height);
      ctx.restore();
      if (badge) drawDangerBadge(ctx, x, y - height / 2 - 15 * scale, scale);
      return;
    }
    drawEnemyFallback(ctx, x, y, time, scale, badge);
  }

  function drawEnemyFallback(ctx, x, y, time = 0, scale = 1, badge = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.rotate(Math.sin(time * 4) * 0.055);
    const skin = '#d18a65';
    const shade = '#b5684e';
    const outline = '#654633';
    const swing = Math.sin(time * 7) * 3;
    // Enemy titans are red, broad and almost twice the size of a human.
    polygon(ctx, [[-18,13],[-19,34],[-8,35],[-3,17]], shade, outline, 2.3);
    polygon(ctx, [[3,17],[8,35],[20,34],[18,13]], skin, outline, 2.3);
    roundedRect(ctx, -22, 31, 16, 7, 3, '#9c6048', outline, 2);
    roundedRect(ctx, 7, 31, 16, 7, 3, '#9c6048', outline, 2);
    polygon(ctx, [[-22,-15],[-32,-9],[-35,11 + swing],[-27,16 + swing],[-22,2]], shade, outline, 2.5);
    polygon(ctx, [[22,-15],[32,-9],[35,11 - swing],[27,16 - swing],[22,2]], skin, outline, 2.5);
    polygon(ctx, [[-21,-18],[-25,1],[-18,19],[18,19],[25,1],[21,-18]], skin, outline, 2.5);
    polygon(ctx, [[-19,11],[19,11],[20,23],[7,24],[0,18],[-7,24],[-20,23]], '#66543c', outline, 2);
    line(ctx, [[-17,-7],[-5,-4],[0,-7],[5,-4],[17,-7]], '#a45d45', 1.8);
    line(ctx, [[0,-3],[0,8]], '#ae654b', 1.5);
    line(ctx, [[-8,3],[-3,3]], '#ae654b', 1.3);
    line(ctx, [[3,3],[8,3]], '#ae654b', 1.3);
    ellipse(ctx, -23, -28, 5, 7, shade, outline, 2);
    ellipse(ctx, 23, -28, 5, 7, skin, outline, 2);
    polygon(ctx, [[-21,-44],[-26,-31],[-21,-15],[-11,-9],[12,-9],[23,-17],[26,-34],[19,-45]], skin, outline, 2.5);
    polygon(ctx, [[-25,-31],[-27,-43],[-20,-42],[-22,-51],[-12,-48],[-6,-56],[1,-50],[10,-54],[14,-47],[24,-48],[23,-40],[28,-37],[24,-28],[17,-37],[8,-35],[1,-40],[-8,-35],[-17,-37]], '#4c3e2e', outline, 2);
    line(ctx, [[-18,-29],[-7,-26]], outline, 3);
    line(ctx, [[7,-26],[18,-29]], outline, 3);
    polygon(ctx, [[-17,-25],[-6,-23],[-8,-19],[-15,-20]], '#fff0c7', null);
    polygon(ctx, [[6,-23],[17,-25],[15,-20],[8,-19]], '#fff0c7', null);
    ellipse(ctx, -10, -22, 1.7, 2.2, '#543a29');
    ellipse(ctx, 10, -22, 1.7, 2.2, '#543a29');
    line(ctx, [[0,-24],[-2,-18],[2,-18]], '#a35d43', 1.5);
    roundedRect(ctx, -12, -16, 24, 6, 2, '#754532', null);
    line(ctx, [[-8,-15],[-8,-11]], '#ffedc4', 3);
    line(ctx, [[-3,-15],[-3,-11]], '#ffedc4', 3);
    line(ctx, [[3,-15],[3,-11]], '#ffedc4', 3);
    line(ctx, [[8,-15],[8,-11]], '#ffedc4', 3);
    if (badge) {
      polygon(ctx, [[0,-72],[9,-63],[0,-54],[-9,-63]], '#f4c18a', '#9c5438', 1.4);
      line(ctx, [[0,-67],[0,-62]], '#8c482f', 2);
      ellipse(ctx, 0, -59, 1, 1, '#8c482f');
    }
    ctx.restore();
  }

  function drawPlayer(ctx, x, feet, time, munch = 0, defeated = false, scale = 1, look = 0) {
    const eating = munch > 0.03 && !defeated;
    const name = eating ? 'player_eat' : 'player_idle';
    const frame = spriteBank.frame(name);
    if (frame) {
      const chomp = munch > 0 ? Math.sin(munch / 0.25 * Math.PI) : 0;
      const height = PLAYER_HEIGHT * scale;
      const width = height * frame.w / frame.h;
      const bob = reducedMotion.matches ? 0 : Math.sin(time * 3.2) * 1.7;
      ctx.save();
      ctx.translate(x, feet);
      ellipse(ctx, 0, 1, 36 * scale, 7 * scale, '#30482b25');
      ctx.translate(0, bob);
      if (defeated) ctx.rotate(-0.06);
      else if (!reducedMotion.matches) ctx.rotate(look * 0.02);
      ctx.scale(1 + chomp * 0.05, 1 - chomp * 0.035);
      spriteBank.draw(ctx, name, -width / 2, -height, width, height);
      ctx.restore();
      return;
    }
    drawPlayerFallback(ctx, x, feet, time, munch, defeated, scale, look);
  }

  function drawPlayerFallback(ctx, x, feet, time, munch = 0, defeated = false, scale = 1, look = 0) {
    ctx.save();
    ctx.translate(x, feet);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const bob = reducedMotion.matches ? 0 : Math.sin(time * 3.2) * 1.7;
    const chomp = munch > 0 ? Math.sin(munch / 0.25 * Math.PI) : 0;
    ellipse(ctx, 0, 1, 43, 8, '#30482b25');
    ctx.translate(0, bob);
    ctx.scale(1 + chomp * 0.045, 1 - chomp * 0.035);
    const skin = '#abc18a';
    const shade = '#819e69';
    // An original, expressive green titan. No anime characters or emblems.
    polygon(ctx, [[-24,-30],[-24,-8],[-29,-2],[-28,3],[-9,3],[-8,-27]], shade, INK, 3);
    polygon(ctx, [[8,-27],[9,3],[29,3],[30,-2],[24,-8],[24,-30]], skin, INK, 3);
    line(ctx, [[-24,-1],[-24,2]], '#607b51', 1.5);
    line(ctx, [[-18,-1],[-18,2]], '#607b51', 1.5);
    line(ctx, [[19,-1],[19,2]], '#607b51', 1.5);
    line(ctx, [[25,-1],[25,2]], '#607b51', 1.5);
    const armLift = chomp * 12;
    polygon(ctx, [[-27,-68],[-37,-64],[-43,-47 - armLift],[-45,-32 - armLift],[-39,-27 - armLift],[-32,-31 - armLift],[-31,-46],[-23,-55]], shade, INK, 3);
    polygon(ctx, [[27,-68],[37,-64],[43,-47 - armLift],[45,-32 - armLift],[39,-27 - armLift],[32,-31 - armLift],[31,-46],[23,-55]], skin, INK, 3);
    line(ctx, [[-42,-35 - armLift],[-39,-32 - armLift]], '#587448', 1.5);
    line(ctx, [[-38,-36 - armLift],[-35,-33 - armLift]], '#587448', 1.5);
    line(ctx, [[38,-36 - armLift],[35,-33 - armLift]], '#587448', 1.5);
    line(ctx, [[42,-35 - armLift],[39,-32 - armLift]], '#587448', 1.5);
    polygon(ctx, [[-23,-73],[-31,-58],[-27,-37],[-20,-29],[21,-29],[28,-40],[31,-58],[23,-73]], skin, INK, 3);
    polygon(ctx, [[-26,-40],[26,-40],[28,-20],[15,-16],[2,-24],[-4,-18],[-16,-17],[-28,-22]], '#665b40', INK, 3);
    polygon(ctx, [[-25,-40],[25,-40],[25,-35],[-25,-35]], '#92815a', null);
    line(ctx, [[-16,-32],[-17,-23]], '#494932', 1.5);
    line(ctx, [[11,-33],[14,-23]], '#494932', 1.5);
    line(ctx, [[-23,-59],[-12,-54],[-2,-56]], '#6e8d57', 2);
    line(ctx, [[2,-56],[12,-54],[23,-59]], '#6e8d57', 2);
    line(ctx, [[0,-53],[0,-44]], '#7b9862', 1.6);
    line(ctx, [[-9,-48],[-3,-48]], '#7b9862', 1.4);
    line(ctx, [[3,-48],[9,-48]], '#7b9862', 1.4);
    roundedRect(ctx, -12, -83, 24, 17, 5, shade, INK, 2.5);
    ellipse(ctx, -35, -103, 7, 11, shade, INK, 2.7);
    ellipse(ctx, 35, -103, 7, 11, skin, INK, 2.7);
    line(ctx, [[-37,-107],[-33,-101]], '#63804f', 1.7);
    line(ctx, [[37,-107],[33,-101]], '#63804f', 1.7);
    polygon(ctx, [[-29,-126],[-35,-112],[-33,-91],[-26,-76],[-13,-67],[13,-67],[27,-76],[34,-93],[35,-112],[27,-128]], skin, INK, 3);
    polygon(ctx, [[-34,-105],[-38,-120],[-34,-132],[-39,-139],[-27,-136],[-24,-146],[-14,-140],[-5,-150],[3,-142],[15,-148],[19,-138],[32,-141],[31,-132],[39,-128],[35,-111],[30,-102],[26,-119],[16,-117],[8,-124],[-2,-118],[-12,-124],[-24,-116],[-28,-103]], '#2e3e2c', INK, 3);
    polygon(ctx, [[-26,-132],[-18,-135],[-11,-130],[-3,-136],[5,-131],[15,-136],[23,-131],[16,-126],[5,-127],[-5,-123],[-15,-129]], '#46553a', null);
    const blink = !defeated && Math.sin(time * 0.83) > 0.994;
    if (defeated) {
      line(ctx, [[-23,-108],[-11,-98]], INK, 3);
      line(ctx, [[-23,-98],[-11,-108]], INK, 3);
      line(ctx, [[11,-108],[23,-98]], INK, 3);
      line(ctx, [[11,-98],[23,-108]], INK, 3);
    } else if (blink) {
      line(ctx, [[-24,-103],[-11,-101]], INK, 2.5);
      line(ctx, [[11,-101],[24,-103]], INK, 2.5);
    } else {
      ellipse(ctx, -17, -103, 10, 8, '#fff6d8', INK, 2);
      ellipse(ctx, 17, -103, 10, 8, '#fff6d8', INK, 2);
      ellipse(ctx, -17 + look * 3, -105, 3.7, 4.7, '#35452d');
      ellipse(ctx, 17 + look * 3, -105, 3.7, 4.7, '#35452d');
      ellipse(ctx, -16 + look * 3, -106.5, 1.1, 1.4, '#fff9e8');
      ellipse(ctx, 18 + look * 3, -106.5, 1.1, 1.4, '#fff9e8');
    }
    line(ctx, [[-27,-114],[-12,-111]], INK, 3.5);
    line(ctx, [[12,-111],[27,-114]], INK, 3.5);
    line(ctx, [[-2,-102],[-4,-94],[3,-94]], '#708d56', 1.8);
    line(ctx, [[-27,-92],[-23,-90]], '#d0a27a', 2.3);
    line(ctx, [[23,-90],[27,-92]], '#d0a27a', 2.3);
    if (defeated) {
      line(ctx, [[-17,-79],[-9,-84],[0,-78],[9,-84],[17,-79]], INK, 3);
    } else if (chomp > 0.12) {
      ellipse(ctx, 0, -81, 24, 10 + chomp * 10, '#3a3528', INK, 2.5);
      ellipse(ctx, 0, -74 + chomp * 2, 12, 4 + chomp * 2, '#d19477');
      roundedRect(ctx, -18, -89 - chomp * 4, 36, 6, 2, '#fff4d6', null);
      roundedRect(ctx, -14, -73 + chomp * 7, 28, 4, 1, '#fff4d6', null);
    } else {
      polygon(ctx, [[-24,-87],[-12,-84],[0,-85],[12,-84],[24,-87],[20,-76],[10,-71],[-10,-71],[-20,-76]], '#fff1ce', INK, 2.5);
      line(ctx, [[-21,-80],[21,-80]], '#a89f78', 1);
      for (let tooth = -15; tooth <= 15; tooth += 6) line(ctx, [[tooth,-84],[tooth,-73]], '#a89f78', 1);
    }
    ctx.restore();
  }

  class Scenery {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.background = document.createElement('canvas');
      this.width = 480;
      this.height = 800;
      this.scale = 1;
      this.particles = Array.from({ length: 112 }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1, color: '', star: false }));
      this.labels = Array.from({ length: 8 }, () => ({ active: false, x: 0, y: 0, life: 0 }));
      this.particleCursor = 0;
      this.labelCursor = 0;
    }

    resize(width, height) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.width = Math.max(480, rect.width);
      this.height = rect.height * this.width / rect.width;
      this.scale = this.canvas.width / this.width;
      this.background.width = this.canvas.width;
      this.background.height = this.canvas.height;
      const ctx = this.background.getContext('2d', { alpha: false });
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      this.paintBackground(ctx);
      return { width: this.width, height: this.height };
    }

    paintBackground(ctx) {
      const w = this.width;
      const h = this.height;
      const random = seededRandom(7219);
      const wallTop = h * 0.405;
      const wallHeight = Math.max(76, h * 0.135);
      const wallBottom = wallTop + wallHeight;
      const sky = ctx.createLinearGradient(0, 0, 0, wallBottom);
      sky.addColorStop(0, '#bfd9c9');
      sky.addColorStop(0.65, '#e0e5bf');
      sky.addColorStop(1, '#f1e6bc');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ellipse(ctx, w * 0.79, h * 0.205, 58, 58, '#f9efc9');
      ellipse(ctx, w * 0.79, h * 0.205, 69, 69, null, '#f9efc94d', 1);
      // Soft, illustrated clouds rather than image assets.
      const clouds = [[0.08,0.16,0.8],[0.88,0.30,0.7],[0.25,0.31,0.55],[0.62,0.075,0.6]];
      for (const [cx,cy,s] of clouds) {
        ctx.save();
        ctx.translate(w * cx, h * cy);
        ctx.scale(s, s);
        ctx.fillStyle = '#f8f3d9a0';
        ctx.beginPath();
        ctx.moveTo(-58, 9);
        ctx.bezierCurveTo(-64,-2,-46,-12,-31,-8);
        ctx.bezierCurveTo(-27,-30,8,-30,15,-10);
        ctx.bezierCurveTo(35,-17,50,-5,49,4);
        ctx.bezierCurveTo(74,2,76,15,57,16);
        ctx.lineTo(-51,16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      polygon(ctx, [[0,wallTop+25],[0,wallTop-30],[w*.09,wallTop-62],[w*.17,wallTop-33],[w*.28,wallTop-80],[w*.39,wallTop-35],[w*.5,wallTop-58],[w*.64,wallTop-15],[w*.78,wallTop-65],[w*.9,wallTop-28],[w,wallTop-52],[w,wallTop+30]], '#a3ba98', null);
      polygon(ctx, [[0,wallTop+30],[0,wallTop-5],[w*.12,wallTop-32],[w*.24,wallTop+2],[w*.36,wallTop-28],[w*.53,wallTop+8],[w*.7,wallTop-22],[w*.85,wallTop+2],[w,wallTop-25],[w,wallTop+35]], '#86a486', null);
      // The wall: warm limestone, staggered joints, watchtowers and an old gate.
      ctx.fillStyle = '#baa886';
      ctx.fillRect(0, wallTop + 8, w, wallHeight);
      ctx.fillStyle = '#d7c6a0';
      ctx.fillRect(0, wallTop + 9, w, wallHeight - 12);
      ctx.fillStyle = '#e6d5ad';
      ctx.fillRect(0, wallTop + 7, w, 8);
      for (let x = -8; x < w; x += 35) {
        roundedRect(ctx, x, wallTop - 7, 23, 19, 2, '#d9c8a3', '#b6a580', 1);
        ctx.fillStyle = '#ebdab4';
        ctx.fillRect(x + 1, wallTop - 7, 21, 4);
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, wallTop + 15, w, wallHeight - 15);
      ctx.clip();
      for (let row = 0; row < wallHeight / 22; row++) {
        const y = wallTop + 16 + row * 22;
        line(ctx, [[0,y],[w,y]], '#b9a78188', 1);
        for (let x = (row % 2) * 27 - 27; x < w; x += 54) {
          line(ctx, [[x,y],[x,y+22]], '#b9a78188', 1);
          if (random() > 0.55) {
            ctx.fillStyle = random() > 0.5 ? '#ead9b044' : '#ac997522';
            ctx.fillRect(x + 2, y + 2, 50, 18);
          }
        }
      }
      ctx.restore();
      for (const tx of [w * 0.075, w * 0.925]) {
        roundedRect(ctx, tx - 21, wallTop - 17, 42, wallHeight + 24, 3, '#c5b38e', '#ad9b77', 1.5);
        ctx.fillStyle = '#dfcea7';
        ctx.fillRect(tx - 19, wallTop - 14, 10, wallHeight + 17);
        ctx.fillStyle = '#e0cea6';
        for (let j = 0; j < 3; j++) ctx.fillRect(tx - 22 + j * 16, wallTop - 25, 12, 14);
        line(ctx, [[tx-22,wallTop-9],[tx+22,wallTop-9]], '#efddba', 4);
        roundedRect(ctx, tx - 4, wallTop + 13, 8, 20, 4, '#7e8061');
        line(ctx, [[tx-20,wallTop+47],[tx+20,wallTop+47]], '#ad9b7780', 1);
      }
      const gateWidth = Math.min(72, w * 0.16);
      ctx.save();
      ctx.translate(w / 2, wallBottom);
      ctx.beginPath();
      ctx.moveTo(-gateWidth/2 - 8, 0);
      ctx.lineTo(-gateWidth/2 - 8, -48);
      ctx.arc(0, -48, gateWidth/2 + 8, Math.PI, 0);
      ctx.lineTo(gateWidth/2 + 8, 0);
      ctx.fillStyle = '#e0cda4';
      ctx.fill();
      ctx.strokeStyle = '#b3a07a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-gateWidth/2, 0);
      ctx.lineTo(-gateWidth/2, -47);
      ctx.arc(0, -47, gateWidth/2, Math.PI, 0);
      ctx.lineTo(gateWidth/2, 0);
      ctx.closePath();
      ctx.fillStyle = '#7d7655';
      ctx.fill();
      ctx.save();
      ctx.clip();
      for (let x = -gateWidth/2; x < gateWidth/2; x += 9) line(ctx, [[x,-85],[x,0]], '#a39167', 2);
      ctx.fillStyle = '#626747';
      ctx.fillRect(-gateWidth/2, -34, gateWidth, 5);
      ctx.fillRect(-gateWidth/2, -12, gateWidth, 5);
      ctx.restore();
      line(ctx, [[0,-78],[0,0]], '#555e42', 2);
      ctx.restore();
      // A little town beneath the wall, with terracotta roofs and cream plaster.
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 15; i++) {
          const x = i * w / 14 + (random() - 0.5) * 15;
          if (Math.abs(x - w/2) < 37) continue;
          const y = wallBottom + 8 + row * 19 + random() * 9;
          const bw = 19 + random() * 18;
          const bh = 17 + random() * 20;
          ctx.fillStyle = row ? '#e3d4ad' : '#d8c9a2';
          ctx.fillRect(x - bw/2, y - bh, bw, bh);
          ctx.fillStyle = '#b5aa81';
          ctx.fillRect(x + bw/2 - 5, y - bh, 5, bh);
          polygon(ctx, [[x-bw/2-4,y-bh],[x,y-bh-13],[x+bw/2+4,y-bh]], row ? ['#ba7956','#c78c61','#a97050'][i%3] : '#b28b65', null);
          line(ctx, [[x-bw/2-3,y-bh],[x+bw/2+3,y-bh]], '#8f7955', 1.3);
          ctx.fillStyle = '#778264';
          ctx.fillRect(x - 5, y - bh + 6, 4, 6);
          if (bw > 26) ctx.fillRect(x + 4, y - bh + 6, 4, 6);
          if (i % 4 === 0) { ctx.fillStyle = '#c6b790'; ctx.fillRect(x + 5, y - bh - 12, 5, 9); }
        }
      }
      const groundY = wallBottom + 37;
      const ground = ctx.createLinearGradient(0, groundY, 0, h);
      ground.addColorStop(0, '#afbd85');
      ground.addColorStop(1, '#839f67');
      ctx.fillStyle = ground;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 6);
      ctx.bezierCurveTo(w*.22,groundY-10,w*.33,groundY+10,w*.5,groundY);
      ctx.bezierCurveTo(w*.72,groundY-8,w*.87,groundY+7,w,groundY-2);
      ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fill();
      // The broad, curved path keeps the playable area visually uncluttered.
      ctx.beginPath();
      ctx.moveTo(w/2-24, groundY);
      ctx.bezierCurveTo(w/2-35,groundY+70,w*.24,h*.82,w*.17,h);
      ctx.lineTo(w*.84,h);
      ctx.bezierCurveTo(w*.76,h*.82,w/2+38,groundY+70,w/2+24,groundY);
      ctx.closePath();
      ctx.fillStyle = '#d5c59a';
      ctx.fill();
      ctx.strokeStyle = '#c1b58a';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w/2-15,groundY+8);
      ctx.bezierCurveTo(w/2-25,groundY+80,w*.32,h*.85,w*.27,h);
      ctx.lineTo(w*.73,h);
      ctx.bezierCurveTo(w*.69,h*.85,w/2+26,groundY+80,w/2+15,groundY+8);
      ctx.closePath();
      ctx.fillStyle = '#ddcea5';
      ctx.fill();
      for (let i = 0; i < 105; i++) {
        const y = groundY + random() * (h - groundY);
        const x = random() * w;
        const progress = (y - groundY) / (h - groundY);
        const pathHalf = 25 + progress * w * .2;
        if (Math.abs(x - w/2) < pathHalf) {
          line(ctx, [[x,y],[x+3+random()*6,y]], '#b7aa7c55', 1);
        } else {
          const size = 2 + progress * 4;
          line(ctx, [[x-size,y],[x,y+2],[x+size,y-2]], '#64865365', 1.2);
          if (i % 8 === 0) ellipse(ctx, x, y - 3, 2, 2, '#efe1a7');
        }
      }
      // Trees and shrubs frame the field without hiding targets.
      for (const side of [-1, 1]) {
        const bx = side < 0 ? -8 : w + 8;
        for (let i = 0; i < 7; i++) {
          const y = groundY + 8 + i * 13;
          const x = bx + side * -1 * (8 + Math.sin(i) * 12);
          ellipse(ctx, x, y, 22 + i * 2, 15 + i, i % 2 ? '#75945e' : '#8aa56b');
        }
        const tx = side < 0 ? 12 : w - 10;
        const ty = groundY + 28;
        line(ctx, [[tx,ty+48],[tx,ty-20]], '#6b7650', 7);
        ellipse(ctx, tx, ty - 24, 30, 39, '#6f915f');
        ellipse(ctx, tx - side * 12, ty - 36, 24, 29, '#86a570');
        ellipse(ctx, tx - side * 17, ty - 47, 15, 17, '#9ab77e');
      }
      // Quiet foreground detail, cached once on resize.
      for (let i = 0; i < 13; i++) {
        const x = i < 7 ? random() * 55 : w - random() * 55;
        const y = h - random() * 80;
        line(ctx, [[x,y],[x-4,y-9],[x,y-3],[x+5,y-12]], '#547848', 2);
        if (i % 3 === 0) { ellipse(ctx,x+5,y-13,3,3,'#f3d789'); ellipse(ctx,x+5,y-13,1,1,'#b6974e'); }
      }
      // A few distant birds.
      for (const [bx,by] of [[w*.16,h*.235],[w*.19,h*.22],[w*.72,h*.33]]) {
        line(ctx, [[bx-4,by],[bx,by+2],[bx+4,by]], '#66866b88', 1.2);
      }
    }

    clearEffects() {
      for (const particle of this.particles) particle.active = false;
      for (const label of this.labels) label.active = false;
    }

    capture(x, y) {
      const count = reducedMotion.matches ? 4 : 13;
      for (let i = 0; i < count; i++) {
        const p = this.particles[this.particleCursor++ % this.particles.length];
        const angle = Math.random() * TAU;
        const speed = 45 + Math.random() * 115;
        p.active = true; p.x = x; p.y = y;
        p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed - 45;
        p.life = p.maxLife = 0.4 + Math.random() * 0.35;
        p.size = 2 + Math.random() * 4;
        p.color = ['#fff5d6','#f5c461','#e69b4e','#dce8b3'][i % 4];
        p.star = i % 3 === 0;
      }
      const label = this.labels[this.labelCursor++ % this.labels.length];
      label.active = true; label.x = x; label.y = y - 24; label.life = 0.85;
    }

    updateEffects(dt) {
      for (const p of this.particles) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) { p.active = false; continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 150 * dt;
      }
      for (const label of this.labels) {
        if (!label.active) continue;
        label.life -= dt;
        label.y -= dt * 43;
        if (label.life <= 0) label.active = false;
      }
    }

    draw(engine, time) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.background, 0, 0);
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const isMenu = engine.state === 'menu';
      const ambientTime = reducedMotion.matches ? 0 : time;
      if (isMenu) {
        const feet = h - (h < 420 ? 20 : 187);
        const playerScale = h < 420 ? .85 : clamp((h - 350) / 300, .95, 1.3);
        const px = h < 420 ? w * .48 : w * .5;
        if (h >= 420) {
          drawHuman(ctx, w*.18, h*.57 + Math.sin(ambientTime*2)*5, 0, ambientTime, 1.05);
          drawEnemy(ctx, w*.82, h*.59 + Math.sin(ambientTime*1.7+2)*4, ambientTime, .78);
        }
        drawPlayer(ctx, px, feet, ambientTime, 0, false, playerScale, Math.sin(ambientTime*.6)*.5);
        if (h > 610) {
          ctx.save();
          ctx.translate(w*.70, feet - 142*playerScale);
          ctx.rotate(.08);
          roundedRect(ctx, -36, -13, 73, 26, 9, '#fff4d9e8', '#536c4540', 1);
          polygon(ctx, [[-20,12],[-26,20],[-9,12]], '#fff4d9', null);
          ctx.fillStyle = '#4b6340'; ctx.font = '800 13px Barlow, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('HUMMM…', 0, 4);
          ctx.restore();
        }
      } else {
        for (const entity of engine.entities) {
          if (entity.kind === 'human') drawHuman(ctx, entity.x, entity.y, entity.variant, ambientTime + entity.phase, 1);
          else drawEnemy(ctx, entity.x, entity.y, ambientTime + entity.phase, 1, true, entity.variant);
        }
        const look = clamp((engine.player.targetX - engine.player.x) / 50, -1, 1);
        drawPlayer(ctx, engine.player.x, h - PLAYER_FEET_OFFSET, ambientTime, engine.player.munch, engine.state === 'over', 1, look);
      }
      for (const p of this.particles) {
        if (!p.active) continue;
        ctx.globalAlpha = Math.min(1, p.life / p.maxLife * 1.8);
        if (p.star) {
          const s = p.size;
          polygon(ctx, [[p.x,p.y-s],[p.x+s*.3,p.y-s*.3],[p.x+s,p.y],[p.x+s*.3,p.y+s*.3],[p.x,p.y+s],[p.x-s*.3,p.y+s*.3],[p.x-s,p.y],[p.x-s*.3,p.y-s*.3]], p.color, null);
        } else ellipse(ctx, p.x, p.y, p.size, p.size, p.color);
      }
      ctx.globalAlpha = 1;
      for (const label of this.labels) {
        if (!label.active) continue;
        ctx.globalAlpha = Math.min(1, label.life * 3);
        ctx.font = '800 32px Barlow, sans-serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = '#385437'; ctx.strokeText('+1', label.x, label.y);
        ctx.fillStyle = '#fff1bf'; ctx.fillText('+1', label.x, label.y);
      }
      ctx.globalAlpha = 1;
    }
  }

  class SoundBank {
    constructor(enabled) {
      this.enabled = enabled;
      this.context = null;
      this.master = null;
    }

    unlock() {
      if (!this.enabled) return;
      try {
        if (!this.context) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
          this.context = new AudioContextClass({ latencyHint: 'interactive' });
          this.master = this.context.createGain();
          this.master.gain.value = 0.16;
          this.master.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      } catch (error) {
        console.warn('[Attack of Hunger] Áudio indisponível; o jogo continua sem som.', error);
      }
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      if (enabled) this.unlock();
      if (this.master && this.context) this.master.gain.setTargetAtTime(enabled ? 0.16 : 0, this.context.currentTime, 0.015);
    }

    tone(frequency, delay, duration, type = 'sine', volume = 0.4, endFrequency = frequency) {
      if (!this.enabled || !this.context || this.context.state !== 'running') return;
      const start = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.009);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
      oscillator.onended = function () { oscillator.disconnect(); envelope.disconnect(); };
    }

    play(name) {
      if (name === 'capture') { this.tone(660,0,.10,'sine',.45); this.tone(990,.055,.13,'sine',.3); }
      if (name === 'start') { this.tone(392,0,.12,'triangle',.35); this.tone(523,.09,.12,'triangle',.35); this.tone(784,.18,.2,'sine',.4); }
      if (name === 'defeat') { this.tone(180,0,.38,'sawtooth',.2,48); this.tone(110,.08,.4,'triangle',.4,40); }
      if (name === 'click') this.tone(520,0,.055,'sine',.2,650);
    }
  }

  function boot() {
    const stage = document.getElementById('game-stage');
    const canvas = document.getElementById('game-canvas');
    if (!canvas.getContext || !canvas.getContext('2d')) {
      console.error('[Attack of Hunger] Canvas 2D não está disponível. Use um navegador moderno.');
      return;
    }
    const engine = new HungerEngine();
    const scenery = new Scenery(canvas);
    const storagePrefix = 'attack-of-hunger:';
    const warnedKeys = new Set();
    function readStorage(key, fallback) {
      try { return localStorage.getItem(storagePrefix + key) ?? fallback; }
      catch (error) {
        if (!warnedKeys.has(key)) { console.warn('[Attack of Hunger] Armazenamento local indisponível. Preferências válidas somente nesta sessão.', error); warnedKeys.add(key); }
        return fallback;
      }
    }
    function writeStorage(key, value) {
      try { localStorage.setItem(storagePrefix + key, String(value)); }
      catch (error) {
        if (!warnedKeys.has(key)) { console.warn('[Attack of Hunger] Não foi possível salvar ' + key + '. O jogo continua normalmente.', error); warnedKeys.add(key); }
      }
    }
    const storedBest = Number(readStorage('best', '0'));
    let best = Number.isSafeInteger(storedBest) && storedBest >= 0 ? storedBest : 0;
    let sessionBest = best;
    const sound = new SoundBank(readStorage('sound', '1') !== '0');
    const screens = {
      menu: document.getElementById('menu-screen'),
      help: document.getElementById('help-screen'),
      pause: document.getElementById('pause-screen'),
      over: document.getElementById('gameover-screen')
    };
    const hud = document.getElementById('game-hud');
    const controls = document.getElementById('play-controls');
    const scoreElement = document.getElementById('current-score');
    const bestElements = document.querySelectorAll('[data-best]');
    const announcer = document.getElementById('announcer');
    const hint = document.getElementById('drag-hint');
    const keys = new Set();
    const held = { left: false, right: false };
    const leftButton = document.getElementById('move-left');
    const rightButton = document.getElementById('move-right');
    let activePointer = null;
    let pointerStartX = 0;
    let pointerStartTarget = 0;
    let helpReturn = 'menu';
    let currentScreen = 'menu';
    let lastFrame = 0;
    let visualTime = 0;
    let scoreAnimation = null;

    function updateBest() { for (const element of bestElements) element.textContent = String(best); }
    function updateSound() {
      for (const button of document.querySelectorAll('[data-action="sound"]')) {
        button.setAttribute('aria-pressed', String(sound.enabled));
        button.setAttribute('aria-label', sound.enabled ? 'Desativar som' : 'Ativar som');
        const use = button.querySelector('use');
        if (use) use.setAttribute('href', sound.enabled ? '#i-sound' : '#i-muted');
        const label = button.querySelector('[data-sound-label]');
        if (label) label.textContent = sound.enabled ? 'Som ativado' : 'Som desativado';
      }
    }
    function clearInput() {
      keys.clear(); held.left = false; held.right = false;
      leftButton.classList.remove('is-held'); rightButton.classList.remove('is-held');
      if (activePointer !== null && stage.hasPointerCapture(activePointer)) {
        try { stage.releasePointerCapture(activePointer); } catch (_) { /* Already released by the browser. */ }
      }
      activePointer = null;
      engine.player.targetX = engine.player.x;
    }
    function showScreen(name, focus = true) {
      currentScreen = name;
      for (const [key, screen] of Object.entries(screens)) screen.hidden = key !== name;
      const inGame = engine.state !== 'menu';
      hud.hidden = !inGame;
      controls.hidden = engine.state !== 'playing' || name !== null;
      stage.dataset.state = engine.state;
      stage.classList.toggle('modal-open', Boolean(name && name !== 'menu'));
      document.body.classList.toggle('is-playing', engine.state === 'playing');
      document.querySelector('.site-header').inert = Boolean(name && name !== 'menu');
      if (focus) {
        const target = name === 'menu' ? screens.menu.querySelector('[data-action="play"]')
          : name === 'help' ? screens.help.querySelector('[data-action="close-help"]')
          : name === 'pause' ? screens.pause.querySelector('[data-action="resume"]')
          : name === 'over' ? screens.over.querySelector('[data-action="restart"]') : stage;
        target.focus({ preventScroll: true });
      }
    }
    function updateHUD() {
      scoreElement.textContent = String(engine.score);
      document.getElementById('current-level').textContent = String(engine.level).padStart(2, '0');
      updateBest();
    }
    function startGame() {
      clearInput();
      sessionBest = best;
      engine.start();
      scenery.clearEffects();
      updateHUD();
      hint.classList.remove('faded');
      document.getElementById('new-record').hidden = true;
      document.getElementById('stage-flash').classList.remove('flash');
      stage.classList.remove('shake');
      showScreen(null);
      sound.unlock();
      sound.play('start');
      announcer.textContent = 'Partida iniciada. Coma humanos e desvie dos titãs.';
      // Intentionally does not create a new animation loop or install new listeners.
    }
    function pauseGame(reason = 'Seu lanche continua bem aqui.') {
      if (!engine.pause()) return;
      clearInput();
      document.getElementById('pause-reason').textContent = reason;
      showScreen('pause');
      announcer.textContent = 'Partida pausada. ' + reason;
    }
    function resumeGame() {
      if (!engine.resume()) return;
      clearInput();
      showScreen(null);
      sound.unlock();
      announcer.textContent = 'Partida retomada.';
    }
    function goMenu() {
      clearInput(); engine.menu(); scenery.clearEffects(); updateBest(); showScreen('menu');
      announcer.textContent = 'Menu inicial. Seu recorde é ' + best + ' humanos.';
    }
    function openHelp() {
      helpReturn = engine.state;
      if (engine.state === 'playing') engine.pause();
      clearInput(); showScreen('help');
    }
    function closeHelp() {
      if (helpReturn === 'playing') resumeGame();
      else if (helpReturn === 'paused') showScreen('pause');
      else goMenu();
    }
    function processEvents() {
      for (const event of engine.drainEvents()) {
        if (event.type === 'capture') {
          scenery.capture(event.x, event.y);
          sound.play('capture');
          updateHUD();
          if (!reducedMotion.matches && scoreElement.animate) {
            if (scoreAnimation) scoreAnimation.cancel();
            scoreAnimation = scoreElement.animate([{ transform: 'scale(1)' },{ transform: 'scale(1.25)', color: '#cf6939' },{ transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' });
          }
          if (engine.score > best) { best = engine.score; writeStorage('best', best); updateBest(); }
        }
        if (event.type === 'defeat') {
          clearInput();
          updateHUD();
          document.getElementById('final-score').textContent = String(engine.score);
          document.getElementById('new-record').hidden = !(engine.score > sessionBest && engine.score >= best);
          showScreen('over');
          const flash = document.getElementById('stage-flash');
          flash.classList.remove('flash');
          if (!reducedMotion.matches) {
            // Restart only this short feedback animation; never the game loop.
            void flash.offsetWidth;
            flash.classList.add('flash');
            stage.classList.add('shake');
          }
          sound.play('defeat');
          announcer.textContent = 'Você comeu outro titã! Fim de jogo. ' + engine.score + ' humanos. Recorde: ' + best + '.';
        }
      }
    }

    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      if (button.tagName === 'A') event.preventDefault();
      const action = button.dataset.action;
      if (action !== 'sound') sound.unlock();
      if (action !== 'sound') sound.play('click');
      if (action === 'play' || action === 'restart') startGame();
      else if (action === 'pause') pauseGame();
      else if (action === 'resume') resumeGame();
      else if (action === 'menu') goMenu();
      else if (action === 'help') openHelp();
      else if (action === 'close-help') closeHelp();
      else if (action === 'sound') {
        sound.setEnabled(!sound.enabled);
        writeStorage('sound', sound.enabled ? '1' : '0');
        updateSound();
        if (sound.enabled) sound.play('click');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' && currentScreen && currentScreen !== 'menu') {
        const focusable = screens[currentScreen].querySelectorAll('button:not([disabled]), [tabindex="0"]');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !screens[currentScreen].contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !screens[currentScreen].contains(document.activeElement))) { event.preventDefault(); first.focus(); }
        return;
      }
      if (event.code === 'Escape' || event.code === 'KeyP') {
        if (event.repeat) { event.preventDefault(); return; }
        if (currentScreen === 'help') { event.preventDefault(); closeHelp(); }
        else if (engine.state === 'playing') { event.preventDefault(); pauseGame(); }
        else if (engine.state === 'paused') { event.preventDefault(); resumeGame(); }
        return;
      }
      if (engine.state !== 'playing') return;
      if (['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)) {
        event.preventDefault(); keys.add(event.code); hint.classList.add('faded');
      }
      if (event.code === 'Space' && document.activeElement === stage) { event.preventDefault(); pauseGame(); }
    });
    document.addEventListener('keyup', function (event) { keys.delete(event.code); });

    function pointerWorldX(event) {
      const rect = stage.getBoundingClientRect();
      return (event.clientX - rect.left) * engine.width / rect.width;
    }
    stage.addEventListener('pointerdown', function (event) {
      if (engine.state !== 'playing' || event.target.closest('button') || activePointer !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      activePointer = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartTarget = engine.player.targetX;
      stage.setPointerCapture(event.pointerId);
      if (event.pointerType === 'mouse') engine.setTarget(pointerWorldX(event));
      hint.classList.add('faded');
      stage.focus({ preventScroll: true });
    });
    stage.addEventListener('pointermove', function (event) {
      if (engine.state !== 'playing') return;
      if (event.pointerType === 'mouse' && (activePointer === null || activePointer === event.pointerId)) {
        if (!event.target.closest('button')) engine.setTarget(pointerWorldX(event));
      } else if (event.pointerId === activePointer) {
        const rect = stage.getBoundingClientRect();
        const delta = (event.clientX - pointerStartX) * engine.width / rect.width;
        engine.setTarget(pointerStartTarget + delta * 1.15);
      }
    });
    function releasePointer(event) { if (event.pointerId === activePointer) activePointer = null; }
    stage.addEventListener('pointerup', releasePointer);
    stage.addEventListener('pointercancel', releasePointer);
    stage.addEventListener('lostpointercapture', releasePointer);
    stage.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    stage.addEventListener('gesturestart', function (event) { event.preventDefault(); }, { passive: false });

    function bindDirection(button, direction) {
      button.addEventListener('pointerdown', function (event) {
        if (engine.state !== 'playing') return;
        event.preventDefault(); event.stopPropagation();
        held[direction] = true;
        button.classList.add('is-held');
        button.setPointerCapture(event.pointerId);
        hint.classList.add('faded');
      });
      const release = function () { held[direction] = false; button.classList.remove('is-held'); };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('click', function (event) {
        // Keyboard and assistive-technology clicks get a useful discrete step.
        if (event.detail === 0 && engine.state === 'playing') engine.setTarget(engine.player.targetX + (direction === 'left' ? -1 : 1) * 64);
      });
    }
    bindDirection(leftButton, 'left');
    bindDirection(rightButton, 'right');

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        pauseGame('A aba ficou em segundo plano. Sua partida está segura.');
        clearInput();
        if (sound.context && sound.context.state === 'running') sound.context.suspend().catch(() => {});
      }
      lastFrame = 0;
    });
    window.addEventListener('blur', function () {
      if (engine.state === 'playing') pauseGame('Quando voltar, seu lanche ainda estará aqui.');
      clearInput();
    });
    window.addEventListener('storage', function (event) {
      if (event.key !== storagePrefix + 'best') return;
      const value = Number(event.newValue);
      if (Number.isSafeInteger(value) && value > best) { best = value; updateBest(); }
    });
    stage.addEventListener('animationend', function (event) {
      if (event.animationName === 'stage-shake') stage.classList.remove('shake');
    });

    function resize() {
      const dimensions = scenery.resize();
      if (dimensions) engine.resize(dimensions.width, dimensions.height);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    resize();
    updateBest(); updateSound(); showScreen('menu', false);

    function paintLegend(id, kind) {
      const legend = document.getElementById(id);
      const ctx = legend.getContext('2d');
      ctx.clearRect(0, 0, legend.width, legend.height);
      ctx.save(); ctx.scale(2, 2);
      if (kind === 'human') drawHuman(ctx, 25, 31, 0, 0, .72, false);
      else drawEnemy(ctx, 25, 31, 0, .48, false, 0);
      ctx.restore();
    }
    paintLegend('human-legend', 'human');
    paintLegend('titan-legend', 'titan');
    spriteBank.onLoad = function () {
      paintLegend('human-legend', 'human');
      paintLegend('titan-legend', 'titan');
    };

    function frame(timestamp) {
      const dt = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.05) : 0;
      lastFrame = timestamp;
      if (!document.hidden) {
        if (engine.state === 'playing') {
          const left = keys.has('ArrowLeft') || keys.has('KeyA') || held.left;
          const right = keys.has('ArrowRight') || keys.has('KeyD') || held.right;
          if (left !== right) engine.move(right ? 1 : -1, dt);
          engine.update(dt);
          if (engine.events.length) processEvents();
          if (engine.elapsed > 5) hint.classList.add('faded');
        }
        if (engine.state !== 'paused') {
          visualTime += dt;
          scenery.updateEffects(dt);
        }
        scenery.draw(engine, visualTime);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
