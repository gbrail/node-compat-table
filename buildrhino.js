var pug = require('pug')
var utils = require('./utils.js');
var $escape = utils.$escape
var $get = utils.$get
var testers = utils.objectifiedTesters();

var results = {
  flagged: {},
  unflagged: {}
}

// TODO load versions some better way
const engine = 'rhino';
const headers = require('./rhinoversions');

Object.keys(headers).forEach((version) => {
  results.flagged[version] = require(`./rhino-results/${version}-es6.json`)
  results.unflagged[version] = require(`./rhino-results/${version}.json`)

  //convert to the actual headers view model
  headers[version] = {
    super: version === 'nightly' ? 'Nightly!' : '',
    version: version === 'nightly'? results.unflagged[version]._version.replace(/-.*/, '') : version,
    includes: headers[version]
  }
})

function requiresFlag (nodeVersion, esVersion, path) {
  var flagged = $get(results.flagged, nodeVersion, esVersion)
  var unflagged = $get(results.unflagged, nodeVersion, esVersion)
  return flagged && unflagged && flagged[path] === true && unflagged[path] !== true
}
function result (type, nodeVersion, esVersion, path) {
  var result = $get(results, type, nodeVersion)
  if (result === undefined) return ''
  result = $get(result, esVersion, path)

  var flaggd = type === 'flagged'
  var flagRequired = flaggd && requiresFlag(nodeVersion, esVersion, path)
  var title = result === true ? (flagRequired ? 'Yes, but requires VERSION_ES6 flag' : 'Test passed') : typeof result === 'string' ? result : 'Test failed'
  result = result === true ? 'Yes' : typeof result === 'string' ? 'Error' : 'No'
  return `<div class="${result} ${type} ${flagRequired ? 'required' : ''}" title="${$escape(title)}">${result === 'Yes' && flagRequired ? 'Flag' : result}</div>`
}

var html = pug.renderFile('rhinoindex.pug', {
  pretty: true,
  flaggable: true,
  headers: headers,
  testers: testers,
  results: function (nodeVersion, esVersion, path) {
    return result('unflagged', nodeVersion, esVersion, path) + result('flagged', nodeVersion, esVersion, path)
  },
  requiresFlag: requiresFlag,
  percent: function (nodeVersion, esVersion, unflagged) {
    var datasource = unflagged ? results.unflagged : results.flagged
    var data = $get(datasource, nodeVersion, esVersion)
    return data ? Math.floor(data._percent * 100) : ''
  }
})

require('fs').writeFileSync('./index.html', html)
