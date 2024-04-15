mdlr('[web]demo:realworld-header', m => {

  m.html`
  <nav class="navbar navbar-light">
  <div class="container">
    <a class="navbar-brand" href="#/">conduit</a>
    <ul class="nav navbar-nav pull-xs-right">
      <li class="nav-item"><a class="nav-link active" href="#/">Home</a></li>
      {#if !user}
        <li class="nav-item"><a class="nav-link" href="#/login">Sign in</a></li>
        <li class="nav-item"><a class="nav-link" href="#/register">Sign up</a></li>
      {:else}
        <li class="nav-item"><a class="nav-link" href="#/editor"><i class="ion-compose"/>New Article</a></li>
        <li class="nav-item"><a class="nav-link" href="#/settings"><i class="ion-gear-a"/>Settings</a></li>
        <li class="nav-item"><a class="nav-link" href="#/profile?username={user.username}"><img loading="lazy" class="user-pic" src={user.image}>{user.username}</a></li>
      {/if}
    </ul>
  </div>
  </nav>`;

  return class {
    user;
  }

})