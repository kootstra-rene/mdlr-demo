mdlr('[web]demo:realworld-profile', m => {

  m.require('[web]demo:realworld-main-articles');

  m.html`
  <div class="profile-page">
    <div class="user-info">
      <div class="container">
        <div class="row">
          {#if profile}
          <div class="col-xs-12 col-md-10 offset-md-1">
            <img src="{profile.image}" class="user-img"/>
            <h4>{profile.username}</h4>
            <p>{profile.bio || ''}</p>
            <button class="btn btn-sm btn-outline-secondary action-btn" on{click}>
              <i class="ion-plus-round" />{following()} {profile.username}
            </button>
          </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row">
        <div class="col-xs-12 col-md-10 offset-md-1">
          <div class="articles-toggle">
            <ul class="nav nav-pills outline-active">
              <li class="nav-item">
                <a class="nav-link {active('')}" href="#/profile?username={username}">Articles</a>
              </li>
              <li class="nav-item">
                <a class="nav-link {active('favorited')}" href="#/profile?username={username}&tab=favorited">Favorited Articles</a>
              </li>
            </ul>
          </div>
          <realworld-main-articles{=}/>
        </div>
      </div>
    </div>
  </div>`;

  return class {
    api;
    user;
    search;

    actions;
    profile;
    articles;

    select;

    active(mode) {
      return mode === (this.search.tab ?? '') ? 'active' : '';
    }

    following() {
      return this.profile.following ? 'Unfollow' : 'Follow';
    }

    async click() {
      const {profile, actions} = this;

      await (profile.following ? actions.unfollow : actions.follow)(profile);
      profile.following = !profile.following;
    }

    get username() {
      return this.search?.username ?? this.user?.username ?? '';
    }

  }

})