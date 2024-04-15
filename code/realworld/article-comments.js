mdlr('[web]demo:realworld-article-comments', m => {

  m.html`
  <div class="col-xs-12 col-md-8 offset-md-2">

    {#if !!user}
    <form class="card comment-form">
      <div class="card-block">
        <textarea class="form-control" placeholder="Write a comment..." rows="3"/>
      </div>
      <div class="card-footer">
        <img src="{user.image}" class="comment-author-img"/>
        <button class="btn btn-sm btn-primary">Post Comment</button>
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
      </div>
    </div>
    {/each}

  </div>`;

  m.style`
    display: contents;
  `;

  return class {
    api;
    user;
    search;

    comments;

    async connected() {
      this.comments = await this.api.getArticleComments(this.user, this.search);
    }

    formatDate(comment) {
      const options = { month: 'long', day: 'numeric', year: 'numeric' };

      return new Intl.DateTimeFormat('en-US', options).format(new Date(comment?.updatedAt || '1970-01-01'));
    }
  }

})