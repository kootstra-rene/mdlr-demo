mdlr('[web]tutorial:svg-clock', m => {

  const utcOffset = (new Date()).getTimezoneOffset();

  const ticks = [...Array(60).keys()].map(n =>
    `<line y1="${n % 5 ? 44 : 37}" y2="47" transform="rotate(${6 * n})"/>`
  );

  m.html`
  <svg viewBox="-50 -50 100 100" clip-path="circle()">
    <circle r="49.5" fill="#111"/>
    <text y="18">{logo}</text>
    <circle r="49.5" fill="none"/>
    ${ticks}

    <line y1="2" y2="-22" stroke="#555" transform="rotate({30 * hours + minutes / 2})"/>
    <line y1="4" y2="-32" stroke="#666" transform="rotate({6 * minutes + seconds / 10})"/>
    <line y1="10" y2="-40" stroke="#b00" transform="rotate({6 * seconds})"/>
  </svg>`;

  m.style`
  position: absolute;
  inset: 0;

  > svg {
    width: 100%;
    height: 100%;
    stroke: #eee;

    > text {
      stroke: none;
      fill: #999;
      font: bold 8px sans-serif;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    > line {
      stroke-linecap: round;

      &[y1='37'] {
        stroke: #666;
      }

      &[y1='44'] {
        stroke: #999;
        stroke-width: 0.5;
      }
    }
  }`;

  return class {
    logo = 'mdlr';
    offset = 0;

    hours = 0;
    minutes = 0;
    seconds = 0;

    beforeRender() {
      const tzOffset = (this.offset + utcOffset) * 60 * 1000;
      const time = new Date(Date.now() + tzOffset);

      this.hours = time.getHours();
      this.minutes = time.getMinutes();
      this.seconds = time.getSeconds();

      return 1000;
    }
  }

})