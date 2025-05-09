mdlr('[web]demo:realworld-app', m => {

  const { Router } = m.require('core:router');

  m.require('[web]demo:realworld-header');
  m.require('[web]demo:realworld-main');
  m.require('[web]demo:realworld-login');
  m.require('[web]demo:realworld-settings');
  m.require('[web]demo:realworld-article');
  m.require('[web]demo:realworld-article-create');
  m.require('[web]demo:realworld-profile');
  m.require('[web]demo:realworld-footer');

  const api = m.require('demo:realworld-api');

  // todo: fix redraw on #if, :else, #each
  m.html`
  <realworld-header user={user}/>
  {#if path === '/'}
    <realworld-main{=}/>
  {:elseif path === '/login'}
    <realworld-login{=} mode="in"/>
  {:elseif path === '/register'}
    <realworld-login{=} mode="up"/>
  {:elseif path === '/settings'}
    <realworld-settings{=}/>
  {:elseif path === '/editor'}
    <realworld-article-create{=}/>
  {:elseif path === '/article'}
    <realworld-article{=}/>
  {:elseif path === '/profile'}
    <realworld-profile{=}/>
  {/if}
  <realworld-footer/>`;

  m.style`
    display: block;
    height: 100%;
    overflow: auto;
    background-color: white;
  `;

  m.global`
    a:hover { cursor: pointer }
    i[class] { padding-right: 4px }
    img.comment-author-img { margin-right: 4px }
  `;

  document.head.innerHTML += `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Conduit</title>
  <link preconnect prefetch href="//code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" rel="stylesheet" type="text/css">
  <link preconnect prefetch href="//fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic" rel="stylesheet" type="text/css">
  <link preconnect prefetch rel="stylesheet" href="//demo.productionready.io/main.css">`;

  const pages = articles => {
    const count = Math.ceil(articles.count / 10);
    return new Array(count).fill(1).map((a, i) => i + 1);
  }

  return class {
    #router = new Router('client');
    api = api;
    path;
    user;
    search;

    actions;
    profile;
    articles;
    pages;

    construct() {
      const update = this.#update.bind(this);

      this.#router.get('/*', update)
      this.#router.get('/', update)

      this.actions = {
        follow: async author => {
          return this.api.follow(this.user, author);
        },
        unfollow: async author => {
          return this.api.unfollow(this.user, author);
        },
        getArticle: async slug => {
          return await this.api.getArticle(this.user, { slug });
        },
        createArticle: async article => {
          return this.api.createArticle(this.user, { article });
        },
        updateArticle: async article => {
          return this.api.updateArticle(this.user, { article });
        },
        deleteArticle: async article => {
          return this.api.deleteArticle(this.user, { article });
        },
        deleteComment: async options => {
          return this.api.deleteArticleComment(this.user, options);
        },
        postComment: async options => {
          return this.api.postArticleComments(this.user, options);
        },
      }
    }

    connected() {
      this.#router.attach(window.location.href)
    }

    disconnected() {
      this.#router.detach();
    }

    select(tag) {
      location.replace(`#/?tab=tag&tag=${tag}`);
    }

    async #update({ path, search = {} }) {
      console.log(path, search);

      const user = JSON.parse(localStorage.getItem('user') || '{}').user;
      this.search = search;
      this.user = user;

      const username = search.username ?? user?.username ?? '';
      const offset = (search.page - 1) * 10;

      if (path === '/') {
        switch (this.search.tab) {
          default:
          case 'global':
            this.articles = await this.api.getArticles(user, { offset });
            break;

          case 'tag':
            this.articles = await this.api.getArticles(user, { ...search, offset });
            break;

          case 'your':
            this.articles = await this.api.getFeed(user, { offset });
            break;
        }
        this.pages = [...pages(this.articles)];
      }
      else if (path === '/profile') {
        const { tab = '' } = search;

        const articles = await this.api.getArticles(user, tab === 'favorited' ? { favorited: username } : { username });
        const profile = await this.api.getProfile(user, search);

        this.articles = articles;
        this.profile = profile;
        this.pages = [...pages(this.articles)];
      }


      // finally set the path to trigger update
      this.path = path;
    }
  }

});