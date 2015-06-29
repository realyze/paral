const Fiber = require('fibers');
const Future = require('fibers/future');
const request = require('request');
const _ = require('lodash');

function getRandomGif() {
  const fut = new Future();
  console.log('getting the GIF...');
  request.get('http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC', (err, res, body) => {
    if (err || res.statusCode !== 200) {
      return fut.throw(err || new Error(body));
    }
    return fut.return(body);
  });
  return fut;
}

var addTask = (fun, obj) => {
  if (obj.running >= obj.limit) {
    return obj.blockedTasks.push(fun);
  }
  ++obj.running;
  var fut = fun();
  obj.futs.push(fut);
  fut.resolve((err, val) => {
    --obj.running;
    if (obj.blockedTasks.length > 0) {
      addTask(obj.blockedTasks.shift(), obj);
    }
  });
}

const map = exports.map = (futureFuns, limit = 10) => {
  var obj = {
    blockedTasks: [],
    futs: [],
    running: 0,
    limit
  }
  futureFuns.forEach((fun) => {
    addTask(fun, obj)
  });
  let fut, results = [];
  while (fut = obj.futs.shift()) {
    results.push(fut.wait());
  }
  return results;
};

Future.task(() => {
  var results = map(_.times(10, () => getRandomGif), 2);
}).resolve(() => console.log('done'))
