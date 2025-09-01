mdlr('canvas:matrix', m => {

  const style = 'width:100%; height:100vh; margin:0; background-color: #000; overflow:hidden;';

  const doc = document.body;

  doc.innerHTML = `<canvas style="${style}"></canvas>`;
  doc.style.cssText = style;

  requestAnimationFrame(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const w = canvas.width = doc.clientWidth;
    const h = canvas.height = doc.offsetHeight;
    const cols = Math.ceil(w / 15);
    const ypos = Array(cols).fill(0);

    let time = 0;
    ctx.font = '14px monospace';

    function matrix(now) {
      requestAnimationFrame(matrix);
      if ((now - time) < (1000 / 24)) return;
      time = now;

      ctx.fillStyle = '#0001';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#0f6';

      ypos.forEach((y, ind) => {
        const text = String.fromCharCode(0x3080 + Math.random() * 96);
        const x = ind * 15;
        ctx.fillText(text, x, y);
        if (y > 100 + Math.random() * h / 15 * cols) ypos[ind] = 0;
        else ypos[ind] = y + 15;
      });
    }

    matrix(0);
  })

  window.addEventListener('resize', () => {
    location.reload();
  });

})