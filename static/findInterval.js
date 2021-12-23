
const dataset = {};

var interval = []

const findInterval = (curr, next) => {
  if (!next)
    return;
  if (curr.y == 0 && next.y == 1){
    interval.push(curr.x);
  }
}

await d3.csv("./state.csv").then((parsed) => {
  dataset.data = parsed.map((row, i, arr) => {
    row.x = +row.x
    row.y = +row.y
    findInterval(arr[i], arr[i+1])
    return row;
  });
  console.log(interval);
});

