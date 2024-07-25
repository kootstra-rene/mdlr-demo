mdlr('[web]demo:realworld-article-meta', m => {

  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  m.html`
  <div class="article-meta">
    {#if article}
      <a href="#/profile?username={article.author.username}"><img alt="author" src="{article.author.image}"/></a>
      <div class="info">
        <a href="#/profile?username={article.author.username}" class="author">{article.author.username}</a>
        <span class="date">{formatDate()}</span>
      </div>
      {#if !details}
        <button class="btn {favoriteClass()} btn-sm pull-xs-right" on{click=favoriteClick}>
          <i class="ion-heart" />{article.favoritesCount}
        </button>
      {:elseif article.author.username !== user.username}
        <button class="btn btn-sm {followClass()}" on{click=followClick}>
          <i class="ion-plus-round" />{following()} {article.author.username}
        </button>
        <button class="btn btn-sm {favoriteClass()}" on{click=favoriteClick}>
          <i class="ion-heart" />{favorited()} Article <span class="counter">({article.favoritesCount})</span>
        </button>
      {:else}
        <button class="btn btn-outline-secondary btn-sm" on{click=editArticle}>
          <i class="ion-edit" />Edit Article
        </button>
        <button class="btn btn-outline-danger btn-sm" on{click=deleteArticle}>
          <i class="ion-trash-a" />Delete Article
        </button>
      {/if}
    {:else}
      <div>...</div>
    {/if}
  </div>`;

  return class {
    api;
    user;
    search;
    actions;

    article;
    details = false;

    followClass() {
      return this.article?.author?.following ? 'btn-secondary' : 'btn-outline-secondary';
    }

    following() {
      return !this.article?.author?.following ? 'Follow' : 'Unfollow';
    }

    favoriteClass() {
      return this.article?.favorited ? 'btn-primary' : 'btn-outline-primary';
    }

    favorited() {
      return !this.article?.favorited ? 'Favorite' : 'Unfavorite';
    }

    formatDate() {
      return dateFormatter.format(new Date(this.article?.updatedAt || '1970-01-01'));
    }

    async favoriteClick(e) {
      this.search.slug = this.article?.slug;
      const result = await this.api.favoriteArticle(this.user, this.search, !this.article?.favorited);
      delete result.favoritedBy;
      Object.assign(this.article, result);

      // todo: how to redraw this properly?
      location.replace(`#/article?slug=${this.article.slug}&t=${Date.now()}`);
    }

    async followClick(e) {
      const {article, actions} = this;

      if (!article?.author) return;

      await (article.author.following ? actions.unfollow : actions.follow)(article.author);
      article.author.following = !article.author.following;
    }

    editArticle() {
      location.replace(`#/editor?slug=${this.article.slug}`);
    }

    deleteArticle() {
      this.actions.deleteArticle(this.article);
      location.replace(`#/`);
    }
  }

})