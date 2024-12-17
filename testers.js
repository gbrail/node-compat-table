// this files patches the `tests-xx.json` files together in 1 object organized by ES version

var testers = {
  ES2015: require('./testers-es6.json')
}

var esnext = require('./testers-es2016plus.json')
Object.keys(esnext).forEach((key) => {
  var year = key.substr(0,4)
  if (/20\d\d/.test(year)) {
    var group = testers['ES'+year] || (testers['ES'+year] = testers['ES'+year] = {})
    group[key.substr(5)] = esnext[key]
  }
})

testers.ESNEXT = require('./testers-esnext.json')

console.log(JSON.stringify(testers, null, 2))
