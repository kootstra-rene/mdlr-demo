mdlr('[web]demo:realworld-main-tags', m => {

  m.require('[web]demo:realworld-tags');

  m.html`
  <div class="sidebar">
    <p>Popular Tags</p>
    <realworld-tags{=}/>
  </div>`;

  return class {
    api;
    user;
    tags = [];
    mode = "default";

    async connected() {
      this.tags = await this.api.getTags(this.user);
    }
  }
})