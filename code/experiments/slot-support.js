mdlr('[web]experiments:slot-support', m => {

  m.html`
  <summary><slot name="caption">@caption</slot></summary>
  <slot name="content">@content</slot>
  `;

  m.style`
  & [slot] {
    border: 1px solid blue;
  }`;

})

mdlr('[web]experiments:slot-usage', m => {

  m.require('[web]experiments:slot-support');

  m.html`
  <slot-support>
    <span slot="caption">{caption}</span>
    <span slot="content">
      <button on{click}>click</button>
      <button on{click=reset}>reset</button>
    </span>
  </slot-support>
  `;

  m.style`
    > slot-support [slot="caption"] {
      border: 1px solid red;
    }
  `;

  return class {
    caption = 'caption';

    click() {
      this.caption = 'clicked';
    }
    
    reset() {
      this.caption = 'caption';
    }
  }

})