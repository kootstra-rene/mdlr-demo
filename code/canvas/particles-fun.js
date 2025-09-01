// https://codepen.io/eltonkamami/full/ANpOQo
mdlr('[web]canvas:particles-fun', m => {
  const colors = ['#f35d4f', '#c0d988', '#6ddaf1'];
  const rand = Math.random;

  function Factory(w, h, c) {
    this.x = (rand() * w);
    this.y = (rand() * h);
    this.rad = (rand() * 1) + 1.5;
    this.rgba = c;
    this.vx = (rand() * 5) - 2.5;
    this.vy = (rand() * 5) - 2.5;
  }

  function findDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  m.html`<canvas{} height={} width={}/>`;

  m.style`
  display: block;
  height: 100%;
  width: 100%;
  background-color: #000;
  position: absolute;
  overflow: hidden;

  canvas {
    height:100%;
    width: 100%;
  }`;

  return class {
    #context;
    canvas;
    height;
    width;
    particles = [];

    connected(elem) {
      this.width = elem.clientWidth;
      this.height = elem.clientHeight;
      const patriclesNum = ((this.width * this.height) / 3000 / 3) >>> 0;

      for (let color of colors) {
        const particles = [];
        for (let i = 0; i < patriclesNum; ++i) {
          particles.push(new Factory(this.width, this.height, color));
        }
        this.particles.push(particles);
        console.log(particles.length);
      }
      this.#context = this.canvas.getContext('2d');
    }

    beforeRender() {
      const { width: w, height: h } = this;
      const ctx = this.#context;

      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (const particles of this.particles) {
        this.#updateParticles(ctx, particles, w, h);
      }

      return 1000 / 50;
    }

    #updateParticles(ctx, particles, w, h) {
      ctx.fillStyle = ctx.strokeStyle = particles[0].rgba;
      ctx.linewidth = 0.5;

      for (const p1 of particles) {
        let factor = 1.0;

        ctx.beginPath();
        for (const p2 of particles) {

          if (findDistance(p1, p2) < 50) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            factor = (factor + 0.5) * 1.1;
          }
        }
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.rad * factor, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, (p1.rad + 5) * factor, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();

        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x > w) p1.vx *= -1;
        if (p1.x < 0) p1.vx *= -1;
        if (p1.y > h) p1.vy *= -1;
        if (p1.y < 0) p1.vy *= -1;
      }
    }
  }

})