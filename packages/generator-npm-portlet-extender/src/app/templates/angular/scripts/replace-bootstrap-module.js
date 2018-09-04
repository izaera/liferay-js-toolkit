var fs = require('fs');

var contents = fs.readFileSync('build/bootstrap.js', 'utf8');

var pkgJson = require('../package.json');
var bootstrapModule = pkgJson.name + '@' + pkgJson.version + '/main';

contents = contents.replace('$$BOOTSTRAP_MODULE$$', bootstrapModule);

fs.writeFileSync('build/bootstrap.js', contents, 'utf8');

console.log('Bootstrap module $$BOOTSTRAP_MODULE$$ replaced by', bootstrapModule);