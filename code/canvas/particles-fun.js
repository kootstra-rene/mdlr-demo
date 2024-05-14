// https://codepen.io/eltonkamami/full/ANpOQo
mdlr('[web]canvas:particles-fun', m => {
  const colors = ['#f35d4f', '#f36849', '#c0d988', '#6ddaf1', '#f1e85b'];
  const rand = Math.random;

  function Factory(w, h) {
    this.x = (rand() * w);
    this.y = (rand() * h);
    this.rad = (rand() * 1) + 1.5;
    this.rgba = colors[Math.round(rand() * 3)];
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
  background-color: #222;
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
    patriclesNum = 1;

    connected(elem) {
      this.width = elem.clientWidth;
      this.height = elem.clientHeight;
      this.patriclesNum = (this.width * this.height) / 3000;

      for (let i = 0; i < this.patriclesNum; ++i) {
        this.particles.push(new Factory(this.width, this.height));
      }

      this.#context = this.canvas.getContext('2d');
    }

    beforeRender() {
      const { width: w, height: h } = this;
      const ctx = this.#context;

      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.patriclesNum; ++i) {
        let p1 = this.particles[i];
        let factor = 1.0;

        ctx.beginPath();
        ctx.linewidth = 0.5;
        ctx.fillStyle = 'transparent';
        ctx.strokeStyle = p1.rgba;
        for (let j = 0; j < this.patriclesNum; ++j) {
          let p2 = this.particles[j];

          if (p1.rgba === p2.rgba && findDistance(p1, p2) < 50) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            factor = (factor + 0.5) * 1.1;
          }
        }
        ctx.closePath();

        ctx.fillStyle = p1.rgba;
        ctx.strokeStyle = p1.rgba;

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

      return 1000 / 50;
    }
  }

})