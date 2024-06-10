mdlr('[web]demo:performance:updates-app', m => {

  const MAX_SIZE = 9;

  m.html`
    {#each c in blocks}
      {#each v in collection}
        <div on{click} id="root" mdlr="{m.name}-{c}.{v}">some: {info} :data ({frame})<span> -- {c*v}</span></div>
      {:else}
      ...
      {/each}
      <span />
    {:else}
      waiting...
    {/each}
    `;

  m.style`
      display: block;
      background-color: #445;
      color: white;
      padding: 0.5rem;
      width: 100%;
      height: 100%;
      text-align: center;
  
      > div {
        background-color: #223;
        line-height: 1rem;
      }
  
      > span {
        display: block;
        height: 0.5rem;
        width:100%;
      }
    `;

  return class {
    blocks = [...Array(MAX_SIZE).keys()];

    // inserting external dependencies into rendering code
    m = m;

    // property changes that lead to DOM node modification (layouts)
    frame = 0;
    #data = 0;
    get info() { return this.#data; }

    // property changes that lead to DOM tree modification (layouts and reflows)
    collection = [];
    #direction = +1;

    construct() {
      setInterval(() => ++this.#data, 1);
      setInterval(this.#cycleGrowShrink.bind(this), 1);
    }

    beforeRender() {
      ++this.frame;
    }

    #cycleGrowShrink() {
      const { collection } = this;

      if (this.#direction > 0) {
        collection.push(this.collection.length);
        if (collection.length >= MAX_SIZE) this.#direction = -1;
      }
      else if (this.#direction < 0) {
        collection.pop();
        if (collection.length <= 0) this.#direction = +1;
      }
    }
  }

})