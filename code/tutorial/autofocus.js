mdlr('[web]tutorial:element-autofocus', m => {

  m.html`
    <button on{click}>search</button>
    {#if show}
      <input autofocus />
    {/if}
    `;

  m.style`
    display: block;
    background-color: #111;
    padding: 0.5em;
  
    input { 
      color: black; 
      margin-left: 0.5em;
    }`;

  return class {
    show = false;

    click() {
      this.show = !this.show;
    }
  }

})
