const  margin     = {top: 20, right: 20, bottom: 20, left: 40};
const  width      = 850 - margin.left - margin.right;
const  height     = 200 - margin.top - margin.bottom;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const xScale     = d3.scaleLinear().range([0, width]);
const yScale     = d3.scaleLinear().range([height, 0]);
const xAxis  = d3.axisBottom(xScale);
const yAxis  = d3.axisLeft(yScale);
var areaGen = d3.area()
  .x(function (d) { return xScale(d.x); })
  .y0(yScale(0))
  .y1(function (d) { return yScale(d.y); });
var mainPane = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const findInterval = (curr, next) => {
  if (!next)
    return;
  if (curr.y == 0 && next.y == 1) {
    interval.push(curr.x);
  }
}

var dataset = {};
var interval = []
var csvFiles = [
  "./sup.csv",
  "./si-ax.csv",
]
Promise.all(
  csvFiles.map(file => d3.csv(file))
).then(([sup, _]) => {
    dataset = sup.map(row => ({ x: +row.index, y: +row.double_support }))
    // check status
    dataset.forEach((_, i, arr) => {
      findInterval(arr[i], arr[i+1])
    })
    xScale.domain(d3.extent(dataset, (d) => d.x))
    yScale.domain(d3.extent(dataset, (d) => d.y))
    mainPane.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    mainPane.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);
    mainPane.append("path")
      .datum(dataset)
      .attr("class", "area")
      .attr("fill", "steelblue")
      .attr("d", areaGen);
  })

