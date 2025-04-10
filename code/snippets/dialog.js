mdlr('[web]snippets:m-dialog', m => {

  m.html`
  {:self open={}}
  <div on{click}>{caption}</div>
  <div>{body}</div>
  `;

  // behavioral css only
  m.style`
    display: grid;
    grid-template-rows: min-content 0fr;

    &[open] {
      grid-template-rows: min-content 1fr;
    }

    > div {
      -webkit-user-select: none;
      user-select: none;

      &:last-child {
        overflow: hidden;
      }
    }
  `;

  return class {
    caption;
    body;
    open;

    click() {
      this.open = !this.open;
    }
  }
})