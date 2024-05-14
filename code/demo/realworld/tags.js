mdlr('[web]demo:realworld-tags', m => {

  m.html`
  <ul class="tag-list">
  {#each tag in tags}
    <li><a href="#/?tag={tag}" class="tag-default tag-pill tag-{mode}">{tag}</a></li>
  {:else}
    <span>loading tags...</span>
  {/each}
  </ul>`;

  return class {
    mode = 'outline';
    tags = [];
  }

})