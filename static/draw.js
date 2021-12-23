const  margin     = {top: 20, right: 20, bottom: 110, left: 40};
const  margin_nav = {top: 320, right: 20, bottom: 30, left: 40};
const  width      = 850 - margin.left - margin.right;
const  height     = 400 - margin.top - margin.bottom;
const  height_nav = 400 - margin_nav.top - margin_nav.bottom;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const xScale     = d3.scaleLinear().range([0, width]);
const xScale_nav = d3.scaleLinear().range([0, width]);
const yScale     = d3.scaleLinear().range([height, 0]);
const yScale_nav = d3.scaleLinear().range([height_nav, 0]);

const xAxis  = d3.axisBottom(xScale);
const yAxis  = d3.axisLeft(yScale);

const brush = d3.brushX()
  .extent([[0, 0], [width, height_nav]])
  .on("brush", brushed)
  .on("end", brushend);

var lineGen = d3.line()
  .x(function (d) { return xScale(d.x); })
  .y(function (d) { return yScale(d.y); });

var lineGen_nav = d3.line()
  .x(function (d) { return xScale_nav(d.x); })
  .y(function (d) { return yScale_nav(d.y); });

// HACK: using clipPath to clip data outside of reactangle
var clip = svg.append("defs").append("svg:clipPath")
  .attr("id", "clip")
  .append("svg:rect")
  .attr("width", width)
  .attr("height", height)
  .attr("x", 0)
  .attr("y", 0);

var lineChartMain = svg.append("g")
.attr("class", "focus")
.attr("transform", `translate(${margin.left},${margin.top})`)
.attr("clip-path", "url(#clip)");

var mainPane = svg.append("g")
.attr("class", "focus")
.attr("transform", `translate(${margin.left},${margin.top})`);

var navPane = svg.append("g")
.attr("class", "context")
.attr("transform", `translate(${margin_nav.left},${margin_nav.top})`);

const dataset = {};

await d3.csv("./si-ax.csv").then((parsed) => {
  dataset.data = parsed.map((row) => {
    row.x = +row.x
    row.y = +row.y
    return row;
  });

  xScale.domain(d3.extent(dataset.data, (d) => d.x))
  yScale.domain(d3.extent(dataset.data, (d) => d.y))
  xScale_nav.domain(xScale.domain());
  yScale_nav.domain(yScale.domain());

  mainPane.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  mainPane.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  lineChartMain.append("path")
    .datum(dataset.data)
    .attr("class", "line")
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr("d", lineGen);

  navPane.append("path")
    .datum(dataset.data)
    .attr("class", "line")
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr("d", lineGen_nav);


  navPane.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height_nav + ")")
    .call(xAxis);

  navPane.append("g")
    .attr("class", "brush")
    .call(brush);
    // .call(brush.move, xScale.range()); // default cover all

});

function brushed({selection}) {
  var s = selection || xScale_nav.range();
  var realMainDomain = s.map(xScale_nav.invert, xScale_nav);
  xScale.domain(realMainDomain);
  mainPane.select(".axis--x").call(xAxis);
  lineChartMain.select(".line").attr("d", lineGen);
}

function brushend(event) {
  console.log(event);
  if (!event.sourceEvent) return;

  var d0 = event.selection.map(xScale_nav.invert);
  var d1 = d0.map(x => Math.round(x+50))
  console.log(d1)
  d3.select(this).transition().call(event.target.move, d1.map(xScale_nav))
}
