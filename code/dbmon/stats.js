mdlr('[web]demo:db-mon:stats-render', m => {

  m.html`Repaint rate {rate.toFixed(2)}/sec`;

  m.style`
    position: fixed;
    width: 150px;
    right: 80px;
    bottom: 0;
    opacity: 0.9;
    cursor: pointer;
    z-index: 100;

    padding: 0 0 3px 3px;
    text-align: left;
    background-color: #020;

    color : #0f0;
    font-family : Helvetica,Arial,sans-serif;
    font-size : 9px;
    font-weight : bold;
    line-height : 15px;
  `;

  return class {
    rate = 0.0;
    history = [];
    lastTime = Date.now();

    beforeRender() {
      return 1000 / 30;
    }

    ping(now = Date.now()) {
      const { lastTime, history } = this;
      const rate = 1000 / (now - lastTime);

      if (rate === Infinity) return;

      history.push(rate);
      if (history.length > 100) {
        history.shift();
      }

      let sum = 0;
      for (let rate of history) {
        sum = sum + rate;
      }

      this.rate = (sum / history.length);
      this.lastTime = now;
    }
  }

})

mdlr('[web]demo:db-mon:stats-memory', m => {

  const bars = [...Array(74)].map(a => `<span />`);

  m.html`
    <div>Mem: {bytes}</div>
    <div{graph}>${bars}</div>
  `;

  m.style`
    position: fixed;
    bottom: 0;
    right: 0;

    width:80px;
    opacity:0.9; 
    cursor:pointer;
    z-index: 100;

    padding: 0 0 3px 3px;
    text-align: left;
    background-color: #020;

    color: #0f0;
    font-family: Helvetica,Arial,sans-serif;
    font-size: 9px;
    font-weight: bold;
    line-height: 15px;

    > div:last-child {
      width: 74px;
      height: 30px;
      background-color: #0f0;

      > span {
        width: 1px;
        height: 30px;
        float: left;
        background-color: #131;
      }
    }
  `;

  const perf = performance.memory ? performance : { memory: { usedJSHeapSize: 0 } };

  const bytesToSize = (bytes, nFractDigit) => {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    nFractDigit = nFractDigit !== undefined ? nFractDigit : 0;
    let precision = Math.pow(10, nFractDigit);
    let i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes * precision / Math.pow(1024, i)) / precision + ' ' + sizes[i];
  };

  const updateGraph = (dom, height, color) => {
    if (!dom) return;

    let child = dom.appendChild(dom.firstChild);
    child.style.height = height.toFixed(2) + 'px';
    if (color) {
      child.style.backgroundColor = color;
    }
  }

  return class {
    graph;
    bytes = 0;
    lastUsedHeap = perf.memory.usedJSHeapSize;

    beforeRender() {
      this.#update();

      return 1000 / 30;
    }

    #update() {
      const heapSize = perf.memory.usedJSHeapSize;
      const delta = heapSize - this.lastUsedHeap;

      this.bytes = bytesToSize(heapSize, 2);
      this.lastUsedHeap = heapSize;

      let normValue = heapSize / (30 * 1024 * 1024);
      let height = Math.min(30, 30 - normValue * 30);
      let color = delta < 0 ? '#830' : '#131';
      updateGraph(this.graph, height, color);
    }
  }

})