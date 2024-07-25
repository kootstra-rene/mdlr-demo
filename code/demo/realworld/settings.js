mdlr('[web]demo:realworld-settings', m => {

  m.html`
  <div class="settings-page">
    <div class="container page">
      <div class="row">

        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Your Settings</h1>

          <form method="dialog">
            <fieldset>
              <fieldset class="form-group">
                <input{image} class="form-control" type="text" placeholder="URL of profile picture" value={user.image}/>
              </fieldset>
              <fieldset class="form-group">
                <input{username} class="form-control form-control-lg" type="text" placeholder="Your Name" value={user.username}/>
              </fieldset>
              <fieldset class="form-group">
                <textarea{bio} class="form-control form-control-lg" rows="8" placeholder="Short bio about you">{user.bio || ''}</textarea>
              </fieldset>
              <fieldset class="form-group">
                <input{email} class="form-control form-control-lg" type="text" placeholder="Email" value={user.email}/>
              </fieldset>
              <fieldset class="form-group">
                <input{password} class="form-control form-control-lg" type="password" placeholder="Password"/>
              </fieldset>
              <button class="btn btn-lg btn-primary pull-xs-right" on{click=update}>
                Update Settings
              </button>
            </fieldset>
          </form>
          {#if !!user}
          <hr />
          <button class="btn btn-outline-danger" on{click=logout}>
            Or click here to logout.
          </button>
          {/if}
        </div>

      </div>
    </div>
  </div>`;

  return class {
    api;
    user;

    bio;
    image;
    email;
    password;
    username;

    logout() {
      localStorage.setItem('user', '{}');

      location.replace('#/');
    }

    async update() {
      const records = [
        ['image', this.image.value, this.user.image !== this.image.value],
        ['username', this.username.value, this.user.username !== this.username.value],
        ['bio', this.bio.value, (this.user.bio || '') !== this.bio.value],
        ['email', this.email.value, this.user.email !== this.email.value],
        ['password', this.password.value, !!this.password.value],
      ];

      const details = records.reduce((a, [key, value, changed]) => {
        if (changed) a[key] = value;
        return a;
      }, {});

      const result = await this.api.updateProfile(this.user, details);
      Object.assign(this.user, result.user);
      localStorage.setItem('user', JSON.stringify(result));

      location.replace('#/');
    }
  }
})