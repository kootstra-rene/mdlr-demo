mdlr('[web]scripts:plotly-density', m => {

  // https://plotly.com/javascript/2d-density-plots/

  const { scripts } = m.require('utils:load-script');

  m.html`{:self{root}}`;

  m.style`
    display: block;
    position: absolute;
    inset: 0;
  `;

  function normal() {
    let x = 0, y = 0, rds, c;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      rds = x * x + y * y;
    } while (rds == 0 || rds > 1);
    c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
    return x * c; // throw away extra sample y * c
  }

  return class {
    root;

    connected(e) {
      scripts([
        "https://cdn.plot.ly/plotly-2.24.1.min.js",
      ], error => {
        if (error) return console.log(error);
        setTimeout(()=>this.plot(this.root),0);
      });
    }

    plot(root) {
      let N = 2000,
        a = -1,
        b = 1.2;

      let step = (b - a) / (N - 1);
      let t = new Array(N), x = new Array(N), y = new Array(N);

      for (let i = 0; i < N; i++) {
        t[i] = a + step * i;
        x[i] = (Math.pow(t[i], 3)) + (0.3 * normal());
        y[i] = (Math.pow(t[i], 6)) + (0.3 * normal());
      }

      var trace1 = {
        x: x,
        y: y,
        mode: 'markers',
        name: 'points',
        marker: {
          color: 'rgb(102,0,0)',
          size: 2,
          opacity: 0.4
        },
        type: 'scatter'
      };
      var trace2 = {
        x: x,
        y: y,
        name: 'density',
        ncontours: 20,
        colorscale: 'Hot',
        reversescale: true,
        showscale: false,
        type: 'histogram2dcontour'
      };
      var trace3 = {
        x: x,
        name: 'x density',
        marker: { color: 'rgb(102,0,0)' },
        yaxis: 'y2',
        type: 'histogram'
      };
      var trace4 = {
        y: y,
        name: 'y density',
        marker: { color: 'rgb(102,0,0)' },
        xaxis: 'x2',
        type: 'histogram'
      };
      var data = [trace1, trace2, trace3, trace4];

      var layout = {
        showlegend: false,
        autosize: false,
        width: this.root.offsetWidth,
        height: this.root.offsetHeight,
        margin: { t: 50 },
        hovermode: 'closest',
        bargap: 0,
        xaxis: {
          domain: [0, 0.85],
          showgrid: false,
          zeroline: false
        },
        yaxis: {
          domain: [0, 0.85],
          showgrid: false,
          zeroline: false
        },
        xaxis2: {
          domain: [0.85, 1],
          showgrid: false,
          zeroline: false
        },
        yaxis2: {
          domain: [0.85, 1],
          showgrid: false,
          zeroline: false
        }
      };

      Plotly.newPlot(root, data, layout);
    }

  }

})