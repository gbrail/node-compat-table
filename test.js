const testers = require('./testers.json')
const fs = require('fs')
const path = require('path')
var version = process.versions.node
var engine = process.jsEngine || 'v8'

var esStaging = /--es_staging/.test(process.execArgv) ? '--es_staging' : ''
if (esStaging) version += '--es_staging'

var harmony = /--harmony/.test(process.execArgv) ? '--harmony' : ''
if (harmony) version += '--harmony'

function silencer() {
  console.log('test had an unhandled rejected promise');
}
process.addListener('unhandledRejection', silencer);

console.log('Testing ' + version)

// This function is needed to run the tests and was extracted from:
// https://github.com/kangax/compat-table/blob/gh-pages/node.js
global.__createIterableObject = function (arr, methods) {
  methods = methods || {}
  if (typeof Symbol !== 'function' || !Symbol.iterator) {
    return {}
  }

  arr.length++
  var iterator = {
    next: function () {
      return {
        value: arr.shift(),
        done: arr.length <= 0
      }
    },
    'return': methods['return'],
    'throw': methods['throw']
  }
  var iterable = {}
  iterable[Symbol.iterator] = function () { return iterator }

  return iterable
}

var output = {
  _version: version,
  _engine: engine + ' ' + process.versions[engine]
}

var versions = Object.keys(testers)
function next (ver) {
  if (!ver) return write()

  var completed = 0
  var results = output[ver] = {
    _successful: 0,
    _count: Object.keys(testers[ver]).length,
    _percent: 0
  }
  Object.keys(testers[ver]).forEach(function (name) {
    var script = testers[ver][name].code
    results[name] = false // make SURE it makes it to the output

    run(script, function (result) {
      // expected results: `e.message` or true/false
      results[name] = typeof result === 'string' ? result : !!result
      if (results[name] === true) results._successful++

      if (++completed === results._count) {
        results._percent = results._successful / results._count
        setTimeout(next, 10, versions.pop())
      }
    })
  })
}
setTimeout(next, 10, versions.pop())

function run (script, cb) {
  // kangax's Promise tests reply on a asyncTestPassed function.
  var async = /asyncTestPassed/.test(script)
  if (async) {
    runAsync(script, function (result) {
      return cb(result)
    })
  } else {
    var result = runSync(script)
    return cb(result)
  }
}

function runAsync (script, cb) {

  /* eslint-disable no-new-func */
  var timer = null

  try {
    var fn = new Function('asyncTestPassed', script)

    fn(function () {
      clearTimeout(timer)
      process.nextTick(function () {
        cb(true)
      })
    })

    timer = setTimeout(function () {
      cb(false)
    }, 5000)
  } catch (e) {
    clearTimeout(timer)
    process.nextTick(function () {
      cb(e.message)
    })
  }
}

function runSync (script) {
  try {
    var fn = new Function(script)
    return fn() || false
  } catch (e) {
    return e.message
  }
}

function write () {
  var json = JSON.stringify(output, null, 2)
  if (/v8-build/.test(version)) {
    version = 'bleeding'
  }
  if (/nightly/.test(version)) {
    version = 'nightly'
    if (esStaging) version += '--es_staging'
    if (harmony) version += '--harmony'
  }
  var destination = path.resolve(__dirname, 'results/' + engine, version + '.json')
  console.log('Saving', destination)
  fs.writeFileSync(destination, json)
}
