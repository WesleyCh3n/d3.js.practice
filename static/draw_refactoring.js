const dataset = {
  accel_x: {
    name: "accel_x", // html id
    mode: "line", // drawing mode
    data: {}, // store data
    csvX: "time", // csv x label
    csvY: "Pelvis_A_X", // csv y label
  },
  accel_y: {
    name: "accel_y", // html id
    mode: "line",
    data: {},
    csvX: "time",
    csvY: "Pelvis_A_Y",
  },
  accel_z: {
    name: "accel_z", // html id
    mode: "line",
    data: {},
    csvX: "time",
    csvY: "Pelvis_A_Z",
  },
  double_support: {
    name: "double_support",
    mode: "area",
    data: {},
    csvX: "time",
    csvY: "double_support",
  },
  rt_single_support: {
    name: "rt_single_support",
    mode: "area",
    data: {},
    csvX: "time",
    csvY: "RT_single_support",
  },
  lt_single_support: {
    name: "lt_single_support",
    mode: "area",
    data: {},
    csvX: "time",
    csvY: "LT_single_support",
  },
};

var interval = []

var csvFiles = [
  "./2021-09-26-18-36_result_Dr Tsai_1.csv",
  "./2021-09-26-18-36_cycle_Dr Tsai_1.csv"
]

var margin = {
  top: 10,
  right: 50,
  bottom: 20,
  left: 50
};
var width = window.innerWidth - margin.left - margin.right;
var lineHeight = 150 - margin.top - margin.bottom;
var areaHeight = 80 - margin.top - margin.bottom;

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
  var h = (mode == "line") ? lineHeight: areaHeight
  var svg = d3
    .select("#" + name)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", h + margin.top+margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + h + ")")

  svg.append("g").attr("class", "y axis");

  svg
    .append("path")
    .attr("class", mode) // Assign a class for styling
    .attr("fill", (mode == "line")?"none":"steelblue")
    .attr("stroke", "steelblue");

  brushXScale.domain(d3.extent(data, (d) => d.x))

  updateChart(data, name, mode);
}

// This function needs to be called to update the already prepared chart
function updateChart(data, name, mode) {
  var svg = d3.select("#" + name + " svg");
  var h = (mode == "line") ? lineHeight: areaHeight
  var yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y)) // input
    .range([h, 0]); // output

  var yAxisGen = (mode == "line") ? (
    d3.axisLeft(yScale)
  ):(
    d3.axisLeft(yScale).ticks(2).tickValues([0,1])
  )

  svg.append("defs")
    .append("clipPath")
    .attr("id", "chart-path")
    .append("rect")
    .attr("width", width)
    .attr("height", h);

  svg.select(".x.axis")
    .call(d3.axisBottom(brushXScale));

  svg.select(".y.axis")
    .call(yAxisGen);

  svg
    .select(`.${mode}`)
    .datum(data)
    .transition()
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

function createNav(data) {
  xScale.domain(d3.extent(data, (d) => d.x))

  var svg = d3
    .select("#minimap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", brushHeight + margin.top + 40)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var gBrush = svg
    .append("g")
    .attr('class', 'brush')
    .call(brush)
    // .call(brush.move, xScale.range());

  var brushResizePath = function(d) {
    var e = +(d.type == "e"),
        x = e ? 1 : -1,
        y = brushHeight / 2;
    return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + ","
      + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + ","
      + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8)
      + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
  }

  gBrush.selectAll(".handle--custom")
  .data([{type: "w"}, {type: "e"}])
  .enter().append("path")
    .attr("class", "handle--custom")
    .attr("stroke", "#000")
    .attr("cursor", "ew-resize")
    .attr("d", brushResizePath);

  var xAxisGen = d3
    .axisBottom(xScale)
    .ticks(interval.length, ",.3f")
    .tickValues(interval)
    .tickSize(-brushHeight)

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
}

function brushed({selection}) {
  var s = selection || xScale.range();
  var realMainDomain = s.map(xScale.invert, xScale);
  brushXScale.domain(realMainDomain);
  d3.select(this).selectAll(".handle--custom")
  .attr("display", null).attr("transform", function(_, i) { return "translate(" + [ s[i], - brushHeight / 4] + ")"; });
}

function brushend(event) {
  if (!event.sourceEvent || !event.selection) return;

  var d0 = event.selection.map(xScale.invert);
  var l = interval.reduce((prev, curr) =>
    Math.abs(curr - d0[0]) < Math.abs(prev - d0[0]) ? curr : prev);
  var r = interval.reduce((prev, curr) =>
    Math.abs(curr - d0[1]) < Math.abs(prev - d0[1]) ? curr : prev);
  d3.select(this).transition().call(event.target.move, [l,r].map(xScale))
  for (var key in dataset) {
    updateChart(
      dataset[key].data,
      dataset[key].name,
      dataset[key].mode
    );
  }
}

Promise.all(
  csvFiles.map(file => d3.csv(file))
).then(([result, cycle]) => {

    for (var key in dataset) {
      dataset[key].data = result.map(row => (
        { x: +row[dataset[key].csvX], y: +row[dataset[key].csvY] }
      ))
    }
    interval = cycle.map(row => row.time)

    createNav(dataset.double_support.data);
    for (var key in dataset) {
      createChart(
        dataset[key].data,
        dataset[key].name,
        dataset[key].mode
      );
    }
  })
