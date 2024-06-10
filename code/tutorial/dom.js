mdlr('[web]tutorial:dom-elementsize', m => {

  m.html`{:self{root}}{root.offsetWidth}x{root.offsetHeight} ({root.offsetWidth*devicePixelRatio}x{root.offsetHeight*devicePixelRatio})`;

  m.style`
  display: flex;
  position: absolute;
  inset: 0;

  align-items: center;
  justify-content: center;
  `;

  return class {
    root;
  }

})