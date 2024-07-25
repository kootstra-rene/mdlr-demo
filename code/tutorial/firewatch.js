// todo: explain why it is better to us element scroll event i.s.o. window scroll event. (local vs global scope)
mdlr('[web]tutorial:firewatch-app', m => {

  const FIRE_WATCH_GAME_IMAGE = 'https://www.firewatchgame.com/images/parallax/parallax';

  m.html`
  {#each l,i in layers}
    <div style="top: {-scrollTop * (l / layers.length)}px">
      <img alt="layer-#{l}" src="${FIRE_WATCH_GAME_IMAGE}{l}.png"/>
      {#if l === 7}
        <span style="opacity:{opacity.toFixed(2)}">scroll down</span>
      {/if}
    </div>
  {/each}

  <main{}>
    <img alt="layer-#8" src="${FIRE_WATCH_GAME_IMAGE}8.png"/>
    <div>You have scrolled {scrollTop.toFixed(1)} pixels.</div>
  </main>`;

  m.style`
  all: initial;
  display: block;
  background-color: rgb(32,0,1);
  height: 100%;
 
  > main {
    height: 100%;
    width: 100%;
    overflow: hidden;
    overflow-y: auto;
    position: relative;

    > div {
      position: absolute;
      text-align: center;
      height: 100%;
      width: 100%;
      background-color: rgb(32,0,1);
      color: white;
      padding: 5rem;
      top: 712px;
    }
  }

  > div {
    position: fixed;
    width: 100%;
    overflow:hidden;
    text-align: center;

    > span {
      display: block;
      position: absolute;
      top: 4em;
      font-size: 1em;
      text-transform: uppercase;
      width:100%;
      color: rgb(220,113,43);
    }
  }

  > div > img, main > img {
    position: relative;
    height: 712px;
    width: 2400px;
    left: 50%;
    top: 0px;
    transform: translate(-50%,0);
  }`;

  return class {
    layers = [0, 1, 2, 3, 4, 5, 6, 7];
    main;

    get opacity() {
      return Math.max(1.0 - Math.max(0, this.scrollTop / 60), 0);
    }

    get scrollTop() {
      return this.main?.scrollTop || 0;
    }
  }

})