
const margin = {
  top: 40,
  bottom: 20,
  left: 50,
  right: 20,
};
const width = 800 - margin.left - margin.right;
const height = 350 - margin.top - margin.bottom;

// Creates sources <svg> element
const svg = d3
.select("body")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom);

// Group used to enforce margin
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Scales setup
const xscale = d3.scaleLinear().range([0, width]);
const yscale = d3.scaleLinear().range([height, 0]);

// Axis setup
const xaxis = d3.axisBottom(xscale);
const g_xaxis = g.append("g").attr("transform", `translate(0, ${height})`);
const yaxis = d3.axisLeft(yscale);
const g_yaxis = g.append("g");

// call
g_xaxis.call(xaxis)
g_yaxis.call(yaxis)


const dataset = {};

await d3.csv("./si-ax.csv").then((parsed) => {
  dataset.data = parsed.map((row) => {
    row.x = +row.x
    row.y = +row.y
    return row;
  });
});

xscale.domain(d3.extent(dataset.data, (d) => d.x))
yscale.domain(d3.extent(dataset.data, (d) => d.y))

g_xaxis.call(xaxis)
g_yaxis.call(yaxis)

var line = d3.line()
    .x(function(d) { return xscale(d.x); })
    .y(function(d) { return yscale(d.y); });

d3.select('svg').append('path')
    .attr('d', line(dataset.data))
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1)
    .attr('fill', 'none');

