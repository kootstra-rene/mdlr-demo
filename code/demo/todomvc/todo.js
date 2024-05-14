mdlr('[web]demo:mvc-todo:completed-icon', m => {

  m.html`
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="none" stroke={completed?"#59A193":"#949494"} stroke-width="3"/>
    <path fill={completed?"#3EA390":"#0000"} d="M72 25L42 71 27 56l-4 4 20 20 34-52z"/>
  </svg>
  `;

  return class {
    completed = false;
  }

})

mdlr('[web]demo:mvc-todo-item', m => {

  m.require('[web]demo:mvc-todo:completed-icon');

  const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  m.html`
  {:self checked={!!completed}}
  <completed-icon{=} on{click=select}/>
  <input on{dblclick=()=>readonly=false} on{keydown=edit} on{blur=submit} value={description} readonly={}/>
  <button on{click=destroy}/>
  `;

  m.style`
    display: block;
    position: relative;
    height: 60px;

    > completed-icon {
      display: inline;
      position: absolute;
      top: 0;
      width: 32px;
      height: 32px;
      margin: calc((60px - 32px)/2) calc(45px - 32px);
    }

    > input {
      all: unset;
      box-sizing: border-box;
      word-break: break-all;
      margin-left: 45px;
      padding: 15px;
      display: block;
      line-height: 1.2;
      transition: color 0.4s;
      font-weight: 400;
      color: #484848;
      font-size: 24px;
      width: calc(100% - 45px);

      &:focus:not([readonly]) {
        position: relative;
        z-index: 2;
        border: 1px solid #999;
        box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
        box-shadow: 0 0 2px 2px #CF7D7D;
      }
    }

    &[checked] > input {
      color: #949494;
      text-decoration: line-through;
    }

    > button {
      display: none;
      position: absolute;
      font-size: 30px;
      padding: 10px;
      width: 40px;
      right:10px;
      top:0;
      color: #949494;

      &:after {
        content: '×';
        height: 100%;
        line-height: 1.1;
      }

      &:hover,&:focus {
        color: #C18585;
      }
    }

    &:hover > button {
      display: block;
    }
  `;

  m.global`
    body {
      contain: unset;
    }
  `;

  return class {
    id;
    description;
    completed;
    readonly = true;

    select; // injectable action
    destroy; // injectable action
    change; // injectable action

    edit({ which, target }) {
      if (which === ENTER_KEY) target.blur();
      if (which === ESCAPE_KEY) {
        target.value = this.description;
        this.readonly = true;
      }
    }

    submit({ target }) {
      if (target.value && target.value !== this.description) {
        this.change(target.value);
      }
      this.readonly = true;
    }
  }

})

mdlr('[web]demo:mvc-todo', m => {

  m.require('[web]demo:mvc-todo-item');

  const ENTER_KEY = 13;

  const createItem = description => ({
    id: Date.now(),
    description,
    completed: false
  })

  const filters = ['all', 'active', 'completed'];

  m.html`
    <header>
      todos
    </header>

    <main>
      <section id="input">
        <input on{keydown=createNew} placeholder="What needs to be done?" autofocus/>
        <input type="checkbox" on{click=toggleAll} checked={completedItems.length===items.length}/>
      </section>

      <section id="overview" hidden={!items.length}>
      {#each i in filtered}
        <mvc-todo-item{=i} change={t=>i.description=t} select={()=>i.completed=!i.completed} destroy={()=>remove(i)}/>
      {/each}
      </section>

      <section id="footer" hidden={!items.length}>
        <span>
          <strong>{activeItems.length}</strong> {activeItems.length===1?'item':'items'} left
        </span>

        <span>
        ${filters.map(filter => (
          `<a class={getFilterClass('${filter}')} href="#/${filter}">${filter[0].toUpperCase()}${filter.slice(1)}</a>`
        ))}
        </span>

        <button class="clear-completed" on{click=()=>{items=activeItems}} hidden={!completedItems.length}>Clear completed</button>
      </section>
    </main>
    <footer/>
  `;

  m.global`
    body {
      font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.4em;
      background: #f5f5f5;
      color: #111111;
      min-width: 230px;
      max-width: 550px;
      margin: 0 auto;
      font-weight: 300;
      overflow:auto
    }

    button {
      all: unset;
    }

    * {
      user-select: none;
    }
  `;

  m.style`
    * {
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    header {
      width: 100%;
      height: 130px;
      line-height: 130px;
      color: #b83f45;
      font-size: 80px;
      font-weight: 200;
      text-align: center;
    }

    footer {
      height: 16px;
    }

    main {
      display: block;
      background: #fff;
      position: relative;
      box-shadow: 
        0 1px 1px rgba(0, 0, 0, 0.2),
        0 8px 0 -3px #f6f6f6,
        0 9px 1px -3px rgba(0, 0, 0, 0.2),
        0 16px 0 -6px #f6f6f6,
        0 17px 2px -6px rgba(0, 0, 0, 0.2),
        0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
    }

    #input {
      display: block;
      width: 100%;
      height: 65px;
      position: relative;
      line-height: 1.4em;
      z-index: 2;

      > input[type="checkbox"] {
        appearance: none;
        position: absolute;
        font-size: 22px;
        color: #949494;
        transform: translate(17px,22px) rotate(90deg);
        
        &::before {
          content: '❯'
        }

        &[checked] {
          color: #484848;
        }
      }

      > input:first-child {
        position: absolute;
        inset: 0;
        font-size: 24px;
        padding: 16px 16px 16px 60px;
        border: none;
        background: rgba(0, 0, 0, 0.003);
        box-shadow: inset 0 -2px 1px rgba(0, 0, 0, 0.03);

        &:focus {
          box-shadow: 0 0 2px 2px #CF7D7D;
          outline: 0;
        }
      }
    }

    #footer {
      width: 100%;
      padding: 9px 15px;
      height: 41px;
      text-align: center;
      font-size: 15px;
      border-top: 1px solid #e6e6e6;
      position: relative;

      span:nth-child(1) {
        text-align: left;
        float: left;

        > strong {
          font-weight: 300;
        }
      }

      span:nth-child(2) {
        position: absolute;
        left: 0;
        right: 0;

        a {
          color: inherit;
          margin: 3px;
          padding: 3px 7px;
          text-decoration: none;
          border: 1px solid transparent;
          border-radius: 3px;

          &.selected, &:hover {
            border-color: #CE4646;
          }
        }
      }

      button {
        position: relative;
        text-align: right;
        float: right;
        z-index: 1;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  
    input::placeholder {
      font-style: italic;
      font-weight: 300;
      color: rgba(0, 0, 0, 0.4);
    }

    mvc-todo-item, #footer {
      border-top: 1px solid #e6e6e6;
    }
  `;

  return class {
    editing;
    items = [];
    #currentFilter = 'all';

    // component life-cycle
    connected() {
      const updateView = () => {
        const filter = location.hash.slice(2);

        this.#currentFilter = filters.includes(filter) ? filter : 'all';
      };

      addEventListener('hashchange', updateView);
      updateView();

      this.#loadItems();
    }

    disconnected() {
      this.#saveItems();
    }

    #loadItems() {
      try {
        this.items = JSON.parse(localStorage.getItem('todos-mdlr')) || [];
      } catch (e) {
        this.items = [];
      }
    }

    #saveItems() {
      try {
        localStorage.setItem('todos-mdlr', JSON.stringify(this.items));
      } catch (e) {
        // nop
      }
    }

    // html properties
    get allItems() {
      return this.items;
    }

    get activeItems() {
      return this.items.filter(item => !item.completed);
    }

    get completedItems() {
      return this.items.filter(item => item.completed);
    }

    get filtered() {
      return this[this.#currentFilter + 'Items'];
    }

    getFilterClass(filter) {
      return this.#currentFilter === filter ? 'selected' : false;
    }

    // behaviour
    toggleAll(event) {
      for (let item of this.items) {
        item.completed = event.target.checked;
      }
    }

    remove(item) {
      this.items = this.items.filter(a => a !== item);
    }

    createNew(event) {
      if (event.which !== ENTER_KEY || !event.target.value) return;

      this.items.unshift(createItem(event.target.value));
      event.target.value = '';
    }
  }

})
