mdlr('[web]demo:realworld-main-articles', m => {

  m.require('[web]demo:realworld-article-meta');
  m.require('[web]demo:realworld-tags');

  m.html`
  {#each article in articles}
    <div class="article-preview">

    <realworld-article-meta{=} article={}/>
    <a href="#/article?slug={article.slug}" class="preview-link">
      <h1>{article.title}</h1>
      <p>{article.description}</p>
      <span>Read more...</span>
      <realworld-tags{=} tags={article.tagList}/>
    </a>
    </div>
  {:else}
    {#if articles === null}
    <div class="article-preview">loading articles...</div>
    {:else}
    <div class="article-preview">No articles are here... yet.</div>
    {/if}
  {/each}`;

  return class {
    api;
    user;
    search;
    actions;
    
    articles;

    select;
  }

})