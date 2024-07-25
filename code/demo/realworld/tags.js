mdlr('[web]demo:realworld-tags', m => {

  m.html`
  <ul class="tag-list">
  {#each tag in tags}
    <li><a class="tag-default tag-pill tag-{mode}" on{click}>{tag}</a></li>
  {:else}
    <span>loading tags...</span>
  {/each}
  </ul>`;

  return class {
    mode = 'outline';
    tags = [];

    click(e) {
      this.select(e.target.textContent);
      e.stopPropagation();
      e.preventDefault();
    }

    select(tag) {
    }
  }

})