mdlr('[web]demo:realworld-article', m => {

  m.require('[web]demo:realworld-article-comments');
  m.require('[web]demo:realworld-article-meta');
  m.require('[web]demo:realworld-tags');

  m.html`
  <div class="article-page">
    <div class="banner">
      <div class="container">
        <h1>{article?.title ?? '...'}</h1>
        <realworld-article-meta{=}/>
      </div>
    </div>

    <div class="container page">
      {#if article}
      <div class="row article-content">
        <div class="col-md-12">
          <p>{article.body}</p>
          <realworld-tags tags={article.tagList}/>
        </div>
      </div>
      {:else}
      <div>loading article...</div>
      {/if}
      <hr />
      {#if article}
      <div class="article-actions">
        <realworld-article-meta{=}/>
      </div>
      <div class="row">
        <realworld-article-comments{=}/>
      </div>
      {/if}
    </div>
  </div>`;

  m.style`
  button + button {
    margin-left: 0.2em;
  }`;

  return class {
    api;
    user;
    search;

    article;
    details = true;

    async connected() {
      this.article = await this.api.getArticle(this.user, this.search);
    }
  }

})