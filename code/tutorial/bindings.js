mdlr('[web]tutorial:default-input', m => {

  m.html`<input value={content} on{input}/><div>hello, {content}</div>`;

  m.style`
  display: inline-block;
  background-color: #111;
  color: #ccc;
  padding: 0.5em;

  div { 
    color: white; 
    padding: 0.5em;
  }`;

  return class {
    content = 'default';

    input({ target }) {
      this.content = target.value;
    }
  }

})

mdlr('[web]tutorial:numeric-input', m => {

  m.html`
    <label>
      <input type="number" value={a} on{change=changeA} min="0" max="10" />
      <input type="range" value={a} on{change=changeA} min="0" max="10" />
    </label>
    <br/>
    <label>
      <input type="number" value={b} on{change=changeB} min="0" max="10" />
      <input type="range" value={b} on{change=changeB} min="0" max="10" />
    </label>
    <br/>
    <p>{a} + {b} = {a + b}</p>`;

  m.style`
    display: inline-block;
    background-color: #111;
    color: #ccc;
    padding: 0.5em;
  
    p {
      margin: 0.5em 0 0 0;
    }`;

  return class {
    a = 4;
    b = 2;

    changeA({ target }) {
      this.a = +target.value;
    }

    changeB({ target }) {
      this.b = +target.value;
    }
  }

})