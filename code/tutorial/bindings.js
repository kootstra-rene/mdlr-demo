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
      <input type="number" data-key="a" value={a} on{input} min="0" max="10"/>
      <input type="range" data-key="a" value={a} on{input} min="0" max="10"/>
    </label>
    <label>
      <input type="number" data-key="b" value={b} on{input} min="0" max="10"/>
      <input type="range" data-key="b" value={b} on{input} min="0" max="10"/>
    </label>
    <p>{a} + {b} = {a+b}</p>`;

  m.style`
    display: inline-block;
    background-color: #111;
    color: #ccc;
    padding: 0.5em;

    > label {
      display: flex;
      align-items: center;
    }

    > p {
      margin: 0.5em 0 0 0;
    }`;

  return class {
    a = 4;
    b = 2;

    input({ target }) {
      const { key } = target.dataset;
      this[key] = +target.value;
    }
  }

})