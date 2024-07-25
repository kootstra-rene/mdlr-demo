mdlr('[web]demo:realworld-article-create', m => {

  m.html`
  <div class="editor-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-10 offset-md-1 col-xs-12">
          <form>
            <fieldset>
              <fieldset class="form-group">
                <input type="text" value={title} class="form-control form-control-lg" placeholder="Article Title" on{input=e=>input('title',e)}/>
              </fieldset>
              <fieldset class="form-group">
                <input type="text" value={description} class="form-control" placeholder="What's this article about?" on{input=e=>input('description',e)}/>
              </fieldset>
              <fieldset class="form-group">
                <textarea value={body} class="form-control" rows="8" placeholder="Write your article (in markdown)" on{input=e=>input('body',e)}/>
              </fieldset>
              <fieldset class="form-group">
                <input type="text" value={tagList} class="form-control" placeholder="Enter tags" on{input=e=>input('tagList',e)}/>
                <div class="tag-list"/>
              </fieldset>
              <button class="btn btn-lg pull-xs-right btn-primary" type="button" on{click}>{mode} Article</button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>`;

  return class {
    search;
    actions;

    #article;

    async connected() {
      this.#article = this.search.slug ? await this.actions.getArticle(this.search.slug) : {};
    }

    input(field, {target}) {
      this.#article[field] = target.value;
    }

    async click() {
      console.log(this.#article);
      this.#article.tagList = this.#article.tagList.map(a => a.trim()).filter(a => a);
      const result = !this.search?.slug ? await this.actions.createArticle(this.#article) : await this.actions.updateArticle(this.#article);
      console.log(result);
      location.replace(`#/editor?slug=${result.slug}`);
    }

    get mode() {
      return !this.search?.slug ? 'Publish' : 'Update';
    }

    get title() {
      return this.#article?.title ?? '';
    }

    get description() {
      return this.#article?.description ?? '';
    }

    get body() {
      return this.#article?.body ?? '';
    }

    get tagList() {
      return this.#article?.tagList ?? [];
    }
  }
})