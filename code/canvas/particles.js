mdlr('canvas:particles', m => {

  const style = `width:100vw; height:100vh;`;

  const doc = document.body;

  doc.innerHTML = `<canvas width=960 height=540 style="${style}"></canvas>`;
  doc.style.margin = "0";
  doc.style.overflow = "hidden";

  const canvas = doc.querySelector('canvas');
  const { width: canvasWidth, height: canvasHeight } = canvas;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = 'white';

  // particles
  const ps = [];
  const maxPs = 128;
  const threshold = 100;
  const speed = 100.0;
  const maxLineWidth = 2;

  // create maxPs
  for (let i = 0; i < maxPs; i++) {
    let p = {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      vx: (Math.random() * speed * 2) - speed,
      vy: (Math.random() * speed * 2) - speed
    }
    ps.push(p);
  }

  function drawCircle(x, y, radius, fill, stroke, strokeWidth) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  // map a point p in a range from a1 to a2
  // into a range from b1 to b2 (linearly)
  function mapRange(p, a1, a2, b1, b2) {
    return (b1 + ((p - a1) * (b2 - b1)) / (a2 - a1));
  }

  function distance(p1, p2) {
    const dx = (p2.x - p1.x);
    const dy = (p2.y - p1.y);
    return Math.sqrt(dy * dy + dx * dx);
  }

  function drawLine(d, p1, p2) {
    ctx.lineWidth = mapRange(d, 0, threshold, maxLineWidth, 0);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  function drawLines(p1) {
    for (let j = 0; j < maxPs; j++) {
      let p2 = ps[j];
      let d = distance(p1, p2);

      if (d < threshold) {
        drawLine(d, p1, p2);
      }
    }
  }

  function move(p, delta) {
    const factor = delta / 1000;
    p.x = p.x + p.vx * factor;
    p.y = p.y + p.vy * factor;
  }

  function bounce(p) {
    if (p.x < 0 || p.x > canvasWidth) { p.vx = -p.vx }
    if (p.y < 0 || p.y > canvasHeight) { p.vy = -p.vy }
  }

  let lastNow = 0;
  function animate(now) {
    let delta = now - lastNow;
    lastNow = now;

    requestAnimationFrame(animate);

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < maxPs; i++) {
      let p1 = ps[i];
      drawCircle(p1.x, p1.y, 2, 'white', 'white', 1);
      drawLines(p1);
      move(p1, delta);
      bounce(p1);
    }
  }

  animate(0);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible') {
      lastNow = performance.now();
    }
  });

})