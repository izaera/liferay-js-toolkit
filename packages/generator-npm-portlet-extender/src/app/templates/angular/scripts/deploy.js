var path = require('path');
var fs = require('fs');

var liferayDir = '<%= liferayDir %>';
var jarName = '<%= projectName %>-1.0.0.jar';

fs.copyFileSync(
	path.join('build', jarName), 
	path.join(liferayDir, 'osgi', 'modules', jarName)
);

console.log(`Deployed ${jarName} to ${liferayDir}`);