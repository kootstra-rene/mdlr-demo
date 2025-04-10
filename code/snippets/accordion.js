mdlr('[web]snippets:m-accordion', m => {

  m.require('[web]snippets:m-dialog');

  m.html`
  {#each s in sections}
    <m-dialog{=s} .open={open(s)} .click={()=>toggle(s)}/>
  {/each}`;

  m.style`
    display: grid;
    height: min-content;
  `;

  return class {
    #open_sections = new Set;
    multiple = false;
    sections = [];

    open(section) {
      return this.#open_sections.has(section);
    }

    toggle(section) {
      const sections = this.#open_sections;
      const active = sections.has(section);

      if (!this.multiple) {
        sections.clear();
      }
      
      if (active) {
        sections.delete(section);
      }
      else {
        sections.add(section);
      }
    }
  }
})