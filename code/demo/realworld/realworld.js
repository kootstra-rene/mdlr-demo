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
  `

  document.head.innerHTML += `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Conduit</title>
  <link prefetch href="//fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic" rel="stylesheet" type="text/css">
  <link prefetch rel="stylesheet" href="//demo.productionready.io/main.css">`;

  return class {
    #router = new Router('client');
    api = api;
    path;
    user;
    search;
    articles;

    constructor() {
      const update = this.#update.bind(this);

      this.#router.get('/*', update)
      this.#router.get('/', update)
    }

    connected() {
      this.#router.attach(window.location.href)
    }

    disconnected() {
      this.#router.detach();
    }

    async #update({ path, search = {} }) {
      this.user = JSON.parse(localStorage.getItem('user') || '{}').user;
      this.search = search;
      this.path = path;

      if (path === '/' || path==='/profile') {
        this.articles = await this.api.getArticles(this.user, this.search);
      }
    }
  }

});