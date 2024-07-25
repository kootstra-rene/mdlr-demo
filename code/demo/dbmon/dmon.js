mdlr('[web]demo:db-mon:data-base-overview', m => {

  m.html`{:self autohide}
  <td>{dbname}</td>
  <td>
    <span class="{lastSample.countClassName}">{lastSample.nbQueries}</span>
  </td>
  {#each q in lastSample.topFiveQueries}
    <td class="{q.elapsedClassName||false}">
      {q.formatElapsed || ''}
      <div class="popover">
        <div class="popover-content">{q.query || ''}</div>
        <div class="arrow"/>
      </div>
    </td>
  {/each}
  `;

  m.style`
    display: table-row;
    height: 1.5rem;
    width: 100%;

    &[hidden] {
      visibility: hidden;
    }

    > td {
      white-space: nowrap;
      border-top: 1px solid #ddd;
      padding: 8px;

      > span.label {
        border-radius: .25em;
        color :#fff;
        font-size: 75%;
        font-weight: 700;
        padding: .2em .6em .3em;
        text-align: center;
        vertical-align: baseline;

        &.label-success {
          background-color: #5cb85c;
        }
        &.label-warning {
          background-color: #f0ad4e;
        }
      }

      &[class=""] > * {
        display: none;
      }

      > div {
        background-color: #fff;
        background-clip: padding-box;
        border: 1px solid #ccc;
        border: 1px solid rgba(0,0,0,.2);
        border-radius: 6px;
        box-shadow:0 5px 10px rgba(0,0,0,.2);
        display: none;
        left: 0;
        max-width: 276px;
        padding: 1px;
        position: absolute;
        text-align: left;
        top: 0;
        white-space: normal;
        z-index: 2;
        margin-left: -10px;

        > div.popover-content {
          padding: 9px 14px;
        }

        > div.arrow,
        > div.arrow:after {
          border-color: transparent;
          border-style: solid;
          display: block;
          height: 0;
          position: absolute;
          width: 0;
        }

        & {
          > div.arrow {
            border-width: 11px;
            border-right-width: 0;
            border-left-color: rgba(0,0,0,.25);
            margin-top: -11px;
            right: -11px;
            top: 50%;

            &:after {
              border-width: 10px;
              border-left-color: #fff;
              border-right-width: 0;
              bottom: -10px;
              content: "";
              right: 1px;
            }
          }
        }
      }
    }

    td.query {
      position: relative;

      &:hover .popover {
        display: block;
        left: -100%;
        width: 100%;
      }
    }
  `;

  return class {
    dbname;
    lastSample = {};
  }

})

mdlr('[web]demo:db-mon:data-bases', m => {

  m.require('[web]demo:db-mon:data-base-overview');

  m.html`
  <table><tbody>
  {#each db in databases}
    <data-base-overview{=db} />
  {/each}
  </tbody></table>
  `;

  m.style`
    display: block;
    overflow: scroll;
    height: 100%;

    table {
      border-collapse: collapse;
      border-spacing: 0;
      width: 100%;
    }

    data-base-overview:nth-child(odd) {
      background: #f9f9f9;
    }
  `;

  return class {
    databases;
  }

})

mdlr('[web]demo:db-mon:settings-panel', m => {

  m.html`
    <label>mutations: {ENV.mutations}%</label>
    <input type="range" value={ENV.mutations} on{change} />
  `;

  m.style`
    display: flex;
    align-items: center;
    padding: 8px;
    position: sticky;
    width: 100%;

    > label {
      font-weight: 700;
      width: 120px;
      flex: none;
    }

    > input {
      flex: 1;
    }
  `;

  return class {
    ENV;

    change(e) {
      this.ENV.mutations = (+e.target.value || 1);
    }
  }

})

mdlr('[web]demo:db-mon', m => {

  const ENV = m.require('demo:db-mon:environment');

  m.require('[web]demo:db-mon:settings-panel');
  m.require('[web]demo:db-mon:stats-render');
  m.require('[web]demo:db-mon:stats-memory');
  m.require('[web]demo:db-mon:data-bases');

  m.html`
    <settings-panel{=} />
    <data-bases{=} />
    <stats-render{.renderer} />
    <stats-memory />
  `;

  m.global`
    body {
      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
      font-size: 14px;
      line-height: 1.43;
      background-color: white;
      color: #333;
    }
  `;

  return class {
    ENV = ENV;
    databases = [];
    renderer;

    construct() {
      setInterval(() => {
        this.databases = ENV.generateData(false).toArray();
        this.renderer?.ping();
      });
    }

    // beforeRender() {
    //   this.databases = ENV.generateData(true).toArray();
    //   this.renderer?.ping();
    // }
  }
})