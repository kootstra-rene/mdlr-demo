mdlr('demo:db-mon:environment', m => {

  let counter = 0;
  let data;

  function formatElapsed(value) {
    let str = parseFloat(value).toFixed(2);
    if (value > 60) {
      minutes = Math.floor(value / 60);
      comps = (value % 60).toFixed(2).split('.');
      seconds = comps[0].padStart(2, '0');
      ms = comps[1];
      str = minutes + ":" + seconds + "." + ms;
    }
    return str;
  }

  function getElapsedClassName(elapsed) {
    let className = 'query';
    if (elapsed >= 10.0) {
      className += ' warn_long';
    }
    else if (elapsed >= 1.0) {
      className += ' warn';
    }
    else {
      className += ' short';
    }
    return className;
  }

  function countClassName(queries) {
    let countClassName = "label";
    if (queries >= 20) {
      countClassName += " label-important";
    }
    else if (queries >= 10) {
      countClassName += " label-warning";
    }
    else {
      countClassName += " label-success";
    }
    return countClassName;
  }

  function updateQuery(object) {
    if (!object) {
      object = {};
    }
    let elapsed = Math.random() * 15;
    object.elapsed = elapsed;
    object.formatElapsed = formatElapsed(elapsed);
    object.elapsedClassName = getElapsedClassName(elapsed);
    object.query = "SELECT blah FROM something";
    object.waiting = Math.random() < 0.5;
    if (Math.random() < 0.2) {
      object.query = "<IDLE> in transaction";
    }
    if (Math.random() < 0.1) {
      object.query = "vacuum";
    }
    return object;
  }

  function cleanQuery(value) {
    if (value) {
      value.formatElapsed = "";
      value.elapsedClassName = "";
      value.query = "";
      value.elapsed = null;
      value.waiting = null;
    }
    else {
      return {
        query: "",
        formatElapsed: "",
        elapsedClassName: "",
        elapsed: null,
        waiting: null
      };
    }
  }

  function generateRow(object, keepIdentity, counter) {
    let nbQueries = Math.floor((Math.random() * 10) + 1);
    if (!object) {
      object = {};
    }
    object.lastMutationId = counter;
    object.nbQueries = nbQueries;
    if (!object.lastSample) {
      object.lastSample = {};
    }
    if (!object.lastSample.topFiveQueries) {
      object.lastSample.topFiveQueries = [];
    }
    if (keepIdentity) {
      // for Angular optimization
      if (!object.lastSample.queries) {
        object.lastSample.queries = [];
        for (let l = 0; l < 12; l++) {
          object.lastSample.queries[l] = cleanQuery();
        }
      }
      for (let j in object.lastSample.queries) {
        let value = object.lastSample.queries[j];
        if (j <= nbQueries) {
          updateQuery(value);
        }
        else {
          cleanQuery(value);
        }
      }
    }
    else {
      object.lastSample.queries = [];
      for (let j = 0; j < 12; j++) {
        if (j < nbQueries) {
          let value = updateQuery(cleanQuery());
          object.lastSample.queries.push(value);
        }
        else {
          object.lastSample.queries.push(cleanQuery());
        }
      }
    }
    for (let i = 0; i < 5; i++) {
      let source = object.lastSample.queries[i];
      object.lastSample.topFiveQueries[i] = source;
    }
    object.lastSample.nbQueries = nbQueries;
    object.lastSample.countClassName = countClassName(nbQueries);
    return object;
  }

  function getData(keepIdentity = false) {
    let oldData = data;
    if (!keepIdentity) { // reset for each tick when !keepIdentity
      data = [];
      for (let i = 1; i <= ENV.rows; i++) {
        data.push({ dbname: 'cluster' + i, query: "", formatElapsed: "", elapsedClassName: "" });
        data.push({ dbname: 'cluster' + i + ' slave', query: "", formatElapsed: "", elapsedClassName: "" });
      }
    }
    if (!data) { // first init when keepIdentity
      data = [];
      for (let i = 1; i <= ENV.rows; i++) {
        data.push({ dbname: 'cluster' + i });
        data.push({ dbname: 'cluster' + i + ' slave' });
      }
      oldData = data;
    }
    for (let i in data) {
      let row = data[i];
      if (!keepIdentity && oldData && oldData[i]) {
        row.lastSample = oldData[i].lastSample;
      }
      if (!row.lastSample || (100*Math.random()) < ENV.mutations) {
        counter = counter + 1;
        if (!keepIdentity) {
          row.lastSample = null;
        }
        generateRow(row, keepIdentity, counter);
      }
      else {
        data[i] = oldData[i];
      }
    }
    return {
      toArray: () => data
    };
  }

  const ENV = {
    generateData: getData,
    rows: 50,
    mutations: 100
  };

  return ENV;
})