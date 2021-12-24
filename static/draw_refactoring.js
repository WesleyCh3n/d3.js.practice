const dataset = {};

var csvFiles = [
  "./si-ax.csv",
  "./sup.csv",
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
var brush = d3.brushX().extent([
  [0, 0],
  [width, brushHeight],
]).on("brush", brushed);

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

  switch (mode) {
    case 'line':
      svg
        .append("path")
        .attr("class", "line") // Assign a class for styling
        .attr("fill", "none")
        .attr("stroke", "steelblue");
      break;
    case 'area':
      svg
        .append("path")
        .attr("class", "area")
        .attr("fill", "steelblue");
      break;
    default:
    svg
      .append("path")
      .attr("class", "line") // Assign a class for styling
      .attr("fill", "none")
      .attr("stroke", "steelblue");
  }

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

  switch (mode) {
    case 'line':
      var gen = d3
      .line()
      .x((d) => brushXScale(d.x))
      .y((d) => yScale(d.y));
      svg
        .select(".line")
        .datum(data) // 10. Binds data to the line
        .attr("clip-path", "url(#chart-path)")
        .attr("d", gen) // 11. Calls the line generator
      break;
    case 'area':
      var gen = d3.area()
      .x((d) => brushXScale(d.x))
      .y0(yScale(0))
      .y1((d) => yScale(d.y));
      svg
        .select(".area")
        .datum(data) // 10. Binds data to the line
        .attr("clip-path", "url(#chart-path)")
        .attr("d", gen) // 11. Calls the line generator
  }
}

function createNav(data) {
  xScale.domain([0, data.length]) // input
  var yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y)) // input
    .range([brushHeight, 0]); // output

  var line = d3
    .line()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  var svg = d3
    .select("#minimap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", brushHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g").call(brush);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + brushHeight + ")")
    .call(d3.axisBottom(xScale));

  svg
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("stroke", "steelblue")
    .attr("fill", "none")
    .attr("d", line);
}

function brushed({selection}) {
  var s = selection || xScale.range();
  var realMainDomain = s.map(xScale.invert, xScale);
  brushXScale.domain(realMainDomain);
  updateChart(dataset.ax, "plot1", "line")
  updateChart(dataset.sup, "plot2", "area")
}

Promise.all(
  csvFiles.map(file => d3.csv(file))
).then(([ax, sup]) => {
    dataset.ax = ax.map(row => ({ x: +row.x, y: +row.y }))
    dataset.sup = sup.map(row => ({ x: +row.index, y: +row.double_support }))
    createNav(dataset.ax);
    createChart(dataset.ax, "plot1", "line")
    createChart(dataset.sup, "plot2", "area")
  })