mdlr('[web]tutorial:each-collection', m => {
  m.html`
  {#each value, key in collection}
    <span>{key}:{value}</span><br/>
  {:else}
   ...
  {/each}`;

  return class {
    collection;
  }
})

mdlr('[web]tutorial:each-set', m => {
  m.require('[web]tutorial:each-collection');

  m.html`<each-collection .collection={set}/>`;

  return class {
    set = new Set(['some', 'words']);
    #t0 = setTimeout(() => { this.set.add('data') }, 100);
  }
})

mdlr('[web]tutorial:each-map', m => {
  m.require('[web]tutorial:each-collection');

  m.html`<each-collection .collection={map}/>`;

  return class {
    map = new Map([['a', 'some'], ['b', 'words']])
    #t0 = setTimeout(() => { this.map.set('c', 'data') }, 100)
  }
})

mdlr('[web]tutorial:each-array', m => {
  m.require('[web]tutorial:each-collection');

  m.html`<each-collection .collection={array}/>`;

  return class {
    array = ['some', 'words'];
    #t0 = setTimeout(() => { this.array.push('data') }, 100)
  }
})

mdlr('[web]tutorial:each-generator', m => {
  m.html`
  {#each value, key in generator()}
    <span>{key}:{value}</span><br/>
  {/each}`;

  return class {
    generator = function* () {
      yield 'some';
      yield 'words';
      yield 'data';
    };
  }
})
