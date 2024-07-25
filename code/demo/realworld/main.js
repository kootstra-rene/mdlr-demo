mdlr('[web]demo:realworld-main', m => {

  m.require('[web]demo:realworld-main-articles');
  m.require('[web]demo:realworld-main-tags');

  m.html`
  <div class="home-page">

    {#if !user}
    <div class="banner">
      <div class="container">
        <h1 class="logo-font">conduit</h1>
        <p>A place to share your knowledge.</p>
      </div>
    </div>
    {/if}

    <div class="container page">
      <div class="row">

        <div class="col-md-9">
          <div class="feed-toggle">
            <ul class="nav nav-pills outline-active">
              {#if !!user}
              <li class="nav-item"><a class="nav-link {active('')}" href="#/?tab">Your Feed</a></li>
              {/if}
              <li class="nav-item"><a class="nav-link {active('global')}" href="#/?tab=global">Global Feed</a></li>
              {#if !!search.tag}
              <li class="nav-item"><a class="nav-link {active('tag')}" on{click=()=>select(search.tag)}># {search.tag}</a></li>
              {/if}
            </ul>
          </div>

          <realworld-main-articles{=}/>
        </div>

        <div class="col-md-3">
          <realworld-main-tags{=}/>
        </div>

      </div>
    </div>

  </div>`;

  return class {
    api;
    user;
    search;
    articles;

    select;

    active(mode) {
      return this.search.tab === mode ? 'active' : '';
    }
  }
})