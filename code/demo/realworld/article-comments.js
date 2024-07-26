mdlr('[web]demo:realworld-article-comments', m => {

  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  m.html`
  <div class="col-xs-12 col-md-8 offset-md-2">

    {#if !!user}
    <form class="card comment-form">
      <div class="card-block">
        <textarea{text} class="form-control" placeholder="Write a comment..." rows="3"/>
      </div>
      <div class="card-footer">
        <img src="{user.image}" class="comment-author-img"/>
        <button class="btn btn-sm btn-primary" on{click=post}>Post Comment</button>
      </div>
    </form>
    {/if}

    {#each comment in comments}
    <div class="card">
      <div class="card-block">
        <p class="card-text">{comment.body}</p>
      </div>
      <div class="card-footer">
        <a href="#/profile" class="comment-author">
          <img src="{comment.author.image}" class="comment-author-img"/>
        </a>
        <a href="#/profile" class="comment-author">{comment.author.username}</a>
        <span class="date-posted">{formatDate(comment)}</span>
        {#if comment.author.username === user.username}
          <button style="float:right" class="btn btn-outline-danger btn-sm" on{click=()=>deleteComment(comment)}>
            <i class="ion-trash-a"/>delete
          </button>
        {/if}
      </div>
    </div>
    {/each}

  </div>`;

  return class {
    api;
    user;
    search;
    actions;

    text;
    comments;

    async connected() {
      this.comments = await this.api.getArticleComments(this.user, this.search);
    }

    formatDate(comment) {
      return dateFormatter.format(new Date(comment?.updatedAt || '1970-01-01'));
    }

    async deleteComment(comment) {
      await this.actions.deleteComment({
        slug: this.search.slug,
        id: comment.id,
      });
      console.log('deleting:', comment);

      this.comments = await this.api.getArticleComments(this.user, this.search);
      this.text.value = '';
    }

    async post() {
      await this.actions.postComment({
        slug: this.search.slug,
        comment: {
          body: this.text.value
        }
      });

      this.comments = await this.api.getArticleComments(this.user, this.search);
      this.text.value = '';
    }
  }

})