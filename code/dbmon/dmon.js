
mdlr('[web]demo:db-mon:data-base-overview', m => {

  m.html`
  <td class="dbname">{dbname}</td>
  <td class="query-count"><span class="{lastSample.countClassName}">{lastSample.nbQueries}</span></td>
  {#each q in lastSample.topFiveQueries}
    <td class="{q.elapsedClassName}">
      {q.formatElapsed || ''}
      <div class="popover left">
        <div class="popover-content">{q.query || ''}</div>
        <div class="arrow"/>
      </div>
    </td>
  {/each}
  `;

  m.style`
    display: table-row;
  `;

  return class {
    dbname;
    lastSample = {};
  }

})

mdlr('[web]demo:db-mon:data-bases', m => {

  m.require('[web]demo:db-mon:data-base-overview');

  m.html`
  <table class="table table-striped latest-data"><tbody>
  {#each db in databases}
    <data-base-overview{=db} />
  {/each}
  </tbody></table>
  `;

  m.style`
    display: block;
    overflow: auto;
    height: 100%;
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
    padding: 0 8px;

    > label {
      width: 120px;
      flex: none;
    }

    > input {
      margin-bottom: 10px;
      margin-top: 5px;
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

  const ENV = m.require('db-mon:environment');

  m.require('[web]demo:db-mon:settings-panel');
  m.require('[web]demo:db-mon:stats-render');
  m.require('[web]demo:db-mon:stats-memory');
  m.require('[web]demo:db-mon:data-bases');

  m.html`
    <stats-render{.renderer} />
    <stats-memory />
    <settings-panel{=} />
    <data-bases{=} />
  `;

  m.style`
    display: contents;
  `;

  m.global`
    body {
      color: #333;
      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
      font-size: 14px;
      line-height: 1.42857143;
      margin: 0;
      overflow: hidden;
      background-color: white
    }

    label {display:inline-block;font-weight:700;margin-bottom:5px;}
    input[type=range] {display:block;width:100%;}
    table {border-collapse:collapse;border-spacing:0;}
    :before,:after {box-sizing: border-box;}
    
    .table > thead > tr > th,.table > tbody > tr > th,.table > tfoot > tr > th,.table > thead > tr > td,.table > tbody > data-base-overview > td,.table > tfoot > tr > td {border-top:1px solid #ddd;line-height:1.42857143;padding:8px;vertical-align:top;}
    .table {width:100%;}
    .table-striped > tbody > data-base-overview:nth-child(odd) > td,.table-striped > tbody > tr:nth-child(odd) > th {background:#f9f9f9;}
    
    .label {border-radius:.25em;color:#fff;display:inline;font-size:75%;font-weight:700;line-height:1;padding:.2em .6em .3em;text-align:center;vertical-align:baseline;white-space:nowrap;}
    .label-success {background-color:#5cb85c;}
    .label-warning {background-color:#f0ad4e;}
    
    .popover {background-color:#fff;background-clip:padding-box;border:1px solid #ccc;border:1px solid rgba(0,0,0,.2);border-radius:6px;box-shadow:0 5px 10px rgba(0,0,0,.2);display:none;left:0;max-width:276px;padding:1px;position:absolute;text-align:left;top:0;white-space:normal;z-index:1010;}
    .popover>.arrow:after {border-width:10px;content:"";}
    .popover.left {margin-left:-10px;}
    .popover.left > .arrow {border-right-width:0;border-left-color:rgba(0,0,0,.25);margin-top:-11px;right:-11px;top:50%;}
    .popover.left > .arrow:after {border-left-color:#fff;border-right-width:0;bottom:-10px;content:" ";right:1px;}
    .popover > .arrow {border-width:11px;}
    .popover > .arrow,.popover>.arrow:after {border-color:transparent;border-style:solid;display:block;height:0;position:absolute;width:0;}
    
    .popover-content {padding:9px 14px;}
    
    .Query {position:relative;}
    .Query:hover .popover {display:block;left:-100%;width:100%;}
  `;

  return class {
    ENV = ENV;
    databases = [];
    renderer;

    #t = setInterval(() => {
      this.databases = ENV.generateData(false).toArray();
      this.renderer?.ping();
    });

    // beforeRender() {
    //   this.databases = ENV.generateData(true).toArray();
    //   this.renderer?.ping();
    // }
  }
})