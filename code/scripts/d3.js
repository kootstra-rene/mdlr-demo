mdlr('[web]scripts:d3-example', m => {

  // https://d3-graph-gallery.com/graph/ridgeline_basic.html

  const { scripts } = m.require('utils:load-script');

  m.html`{:self{div}}`;

  m.style`
    display: block;
    position: absolute;
    inset: 0;
  `;

  function kernelDensityEstimator(kernel, X) {
    return V => X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
  }

  function kernelEpanechnikov(k) {
    return v => Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  }

  return class {
    div;

    connected() {
      scripts([
        'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.4/d3.min.js',
      ], error => {
        if (error) return console.log(error);

        const { offsetWidth, offsetHeight } = this.div;

        // set the dimensions and margins of the graph
        const margin = { top: 60+0.1*offsetHeight, right: 30, bottom: 20, left: 110+0.1*offsetWidth },
          width = 0.8*offsetWidth - margin.left - margin.right,
          height = 0.8*offsetHeight - margin.top - margin.bottom;

        d3.csv('https://raw.githubusercontent.com/zonination/perceptions/master/probly.csv').then(data => {

          const categories = data.columns;

          const x_axis = d3.scaleLinear().domain([-10, 140]).range([0, width]);
          const y_axis = d3.scaleLinear().domain([0, 0.4]).range([height, 0]);
          const y_axis_names = d3.scaleBand().domain(categories).range([0, height]).paddingInner(1);

          const kde = kernelDensityEstimator(kernelEpanechnikov(7), x_axis.ticks(40)) // increase this 40 for more accurate density.
          const densities = categories.map(key => ({ key, density: kde(data.map(d => d[key])) }));

          const svg = d3.select(this.div)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

          svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x_axis));

          svg.append('g')
            .call(d3.axisLeft(y_axis_names));

          svg.selectAll('areas')
            .data(densities)
            .join('path')
            .attr('transform', d => `translate(0, ${(y_axis_names(d.key) - height)})`)
            .datum(d => d.density)
            .attr('fill', '#69b3a2')
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .attr('d',
              d3.line()
                .curve(d3.curveBasis)
                .x(d => x_axis(d[0]))
                .y(d => y_axis(d[1]))
            )

        })
      });
    }

  }

})