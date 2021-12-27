const dataset = {
  ax: {
    name: "ax",
    mode: "line",
    data: {},
  },
  doubleSupport: {
    name: "doubleSupport",
    mode: "area",
    data: {},
  },
};

var interval = []

var csvFiles = [
  "./accelaration.csv",
  "./support.csv",
  "./cycle.csv"
]

var margin = {
  top: 10,
  right: 50,
  bottom: 20,
  left: 50
};
var width = window.innerWidth - margin.left - margin.right;
var height = 200 - margin.top - margin.bottom;

var xScale = d3.scaleLinear().range([0, width]);
var brushXScale = d3.scaleLinear().range([0, width]);
var brushHeight = 50
var brush = d3
  .brushX()
  .extent([[0, 0], [width, brushHeight]])
  .on("brush", brushed)
  .on("end", brushend);

// This function is for the one time preparations
function createChart(data, name, mode) {
  var svg = d3
    .select("#" + name)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")

  svg.append("g").attr("class", "y axis");

  svg
    .append("path")
    .attr("class", mode) // Assign a class for styling
    .attr("fill", (mode == "line")?"none":"steelblue")
    .attr("stroke", "steelblue");

  brushXScale.domain([0, data.length])

  updateChart(data, name, mode);
}

// This function needs to be called to update the already prepared chart
function updateChart(data, name, mode) {
  var svg = d3.select("#" + name + " svg");
  var yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y)) // input
    .range([height, 0]); // output


  svg.append("defs")
    .append("clipPath")
    .attr("id", "chart-path")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  svg.select(".x.axis")
    .call(d3.axisBottom(brushXScale));

  svg.select(".y.axis")
    .call(d3.axisLeft(yScale));

  svg
    .select(`.${mode}`)
    .datum(data)
    .attr("clip-path", "url(#chart-path)")
    .attr("fill", (mode == 'line') ? "none": "steelblue")
    .attr("d", createGen(brushXScale, yScale, mode));
}

const createGen = (xScale, yScale, mode) => {
  switch (mode) {
    case 'line':
      return d3
        .line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));
    case 'area':
      return d3
        .area()
        .x((d) => xScale(d.x))
        .y0(yScale(0))
        .y1((d) => yScale(d.y));
  }
}

function createNav(data, mode) {
  xScale.domain([0, data.length]) // input
  var yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y)) // input
    .range([brushHeight, 0]); // output

  var svg = d3
    .select("#minimap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", brushHeight + margin.top + 40)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("g")
    .call(brush);
    // .call(brush.move, xScale.range());

  var xAxisGen = d3
    .axisBottom(xScale)
    .ticks(interval.lenght)
    .tickValues(interval)
    .tickSize(-200)
  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + brushHeight + ")")
    .call(xAxisGen)
    .selectAll(".tick text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-40)");

  /* svg
   *   .append("path")
   *   .datum(data)
   *   .attr("class", mode)
   *   .attr("stroke", "gray")
   *   .attr("stroke-width", 1.5)
   *   .attr("fill", (mode == 'line') ? "none": "none") // INFO: can't brush w/ color
   *   .attr("d", createGen(xScale, yScale, 'area')); */
}

function brushed({selection}) {
  var s = selection || xScale.range();
  var realMainDomain = s.map(xScale.invert, xScale);
  brushXScale.domain(realMainDomain);
  for (var key in dataset) {
    updateChart(
      dataset[key].data,
      dataset[key].name,
      dataset[key].mode
    );
  }
  /* updateChart(dataset.ax, "plot1", "line")
   * updateChart(dataset.sup, "plot2", "area") */
}


function brushend(event) {
  if (!event.sourceEvent) return;

  var d0 = event.selection.map(xScale.invert);
  var l = interval.reduce((prev, curr) =>
    Math.abs(curr - d0[0]) < Math.abs(prev - d0[0]) ? curr : prev);
  var r = interval.reduce((prev, curr) =>
    Math.abs(curr - d0[1]) < Math.abs(prev - d0[1]) ? curr : prev);
  d3.select(this).transition().call(event.target.move, [l,r].map(xScale))
}

const findInterval = (interval, curr, next) => {
  if (!next)
    return;
  if (curr.y == 0 && next.y == 1) {
    interval.push(curr.x);
  }
}

Promise.all(
  csvFiles.map(file => d3.csv(file))
).then(([accelaration, support, cycle]) => {

    // TODO: refactor this index member
    dataset.ax.data = accelaration.map(row => ({ x: +row.index, y: +row['si-ax'] }))
    dataset.doubleSupport.data = support.map(row => ({ x: +row.index, y: +row.double_support }))

    interval = cycle.map(row => row.cycle)

    /* dataset.doubleSupport.data.forEach((_, i, arr) => {
     *   findInterval(interval, arr[i], arr[i+1])
     * }) */
    createNav(dataset.doubleSupport.data, "area");
    for (var key in dataset) {
      createChart(
        dataset[key].data,
        dataset[key].name,
        dataset[key].mode
      );
    }
  })
