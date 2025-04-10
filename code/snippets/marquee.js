mdlr('[web]snippets:m-marquee', m => {

  m.html`
    {:self style="--count:{items.length}" on{animationiteration=next}}
    {#each _,i in items}
      <div{items[i]} style="--id:{i}"><slot name={i} /></div>
    {/each}
  `;

  m.style`
    display: inline-block;
    position: relative;
    overflow: hidden;
    mask-image: linear-gradient(to right, #0000, #000f 20%, #000f 80%, #0000);

    > div {
      position: absolute;
      width: 200px;
      height: 100%;
      transform: translateX(max(100%, calc(200px * var(--count))));

      animation: marquee-scroll-left 10s linear infinite;
      animation-delay: calc(-4.5s + (10s * var(--id) / var(--count)));
    }
  `;

  m.global`
    @keyframes marquee-scroll-left {
      to {
        transform: translateX(-200px);
      }
    }
  `;

  return class {
    items = new Array(10).fill(0);
    slots = [];
    #base = this.items.length;

    connected(_, slots) {
      this.slots = [...slots];
    }

    next(e) {
      // console.log(Date.now(), getComputedStyle(e.target).getPropertyValue('--id'), this.#base);
      e.target.replaceChildren(this.slots[this.#base]);
      this.#base = (this.#base + 1) % this.slots.length;
    }
  }

})