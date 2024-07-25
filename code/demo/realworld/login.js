mdlr('[web]demo:realworld-login', m => {

  m.html`
  <div class="auth-page">
    <div class="container page">
      <div class="row">

        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Sign {mode}</h1>

          {#if mode === 'up'}
          <p class="text-xs-center">
            <a href="#/login">Have an account?</a>
          </p>
          {:else}
          <p class="text-xs-center">
            <a href="#/register">Need an account?</a>
          </p>
          {/if}

          <ul class="error-messages">
            {#if error}
            <li>{error}</li>
            {/if}
          </ul>

          <form method="dialog">
            {#if mode === 'up'}
            <fieldset class="form-group">
              <input{username} class="form-control form-control-lg" type="text" placeholder="Your Name"/>
            </fieldset>
            {/if}

            <fieldset class="form-group">
              <input{email} class="form-control form-control-lg" type="text" placeholder="Email"/>
            </fieldset>

            <fieldset class="form-group">
              <input{password} class="form-control form-control-lg" type="password" placeholder="Password"/>
            </fieldset>

            <button class="btn btn-lg btn-primary pull-xs-right" on{click}>
              Sign {mode}
            </button>
          </form>
        </div>

      </div>
    </div>
  </div>`;

  m.style`
  ul {
    height: 1.5rem;
    line-height: 1.5rem;
  }`;

  return class {
    api;
    mode = '';
    error;

    username;
    email;
    password;

    click(e) {
      if (this.mode === 'in') this.login();
      if (this.mode === 'up') this.signup();
    }

    async login() {
      const email = this.email.value;
      const password = this.password.value;

      const result = await this.api.login(email, password);
      this.updateUserAndRedirect(result);
    }

    async signup() {
      const email = this.email.value;
      const password = this.password.value;
      const username = this.username.value;

      const result = await this.api.signup(email, password, username);
      this.updateUserAndRedirect(result);
    }

    updateUserAndRedirect(result) {
      if (result.errors) {
        this.error = Object.entries(result.errors).reduce((a, [key, list]) => {
          return a + `${key} ${list.join(', ')}`;
        }, '');;
      }
      else {
        localStorage.setItem('user', JSON.stringify(result)); // Q: whos responsibility is this?

        location.replace('#/');
      }
    }


  };

})