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
              <li class="nav-item"><a class="nav-link {active('')}" href="#/?tab=global">Global Feed</a></li>
              {#if !!user}
                <li class="nav-item"><a class="nav-link {active('your')}" href="#/?tab=your">Your Feed</a></li>
              {/if}
              {#if !!search.tag}
                <li class="nav-item"><a class="nav-link {active('tag')}" on{click=()=>select(search.tag)}># {search.tag}</a></li>
              {/if}
            </ul>
          </div>

          <realworld-main-articles{=}/>
          <nav>
            <ul class="pagination">
            {#each page in pages}
              <li class="page-item {(+search.page || 1) === page ? 'active' : ''}">
                <button class="page-link" on{click}>{page}</button>
              </li>
            {/each}
            </ul>
          </nav>
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
    pages;

    select;

    active(mode) {
      return mode === (this.search.tab ?? '') ? 'active' : '';
    }

    click(e) {
      const {tab,tag} = this.search;
      const page = e.target.textContent;
      location.replace(`#/?tab=${tab||''}${tag?`&tag=${tag}`:''}&page=${page}`);
    }
  }
})