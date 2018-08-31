const fs = require('fs');
const ncp = require('ncp').ncp;

const generators = ['app'];

generators.forEach(generator => {
	mkdir('generators');
	mkdir(`generators/${generator}`);
	mkdir(`generators/${generator}/templates`);

	ncp(
		`src/${generator}/templates`,
		`generators/${generator}/templates`,
		err => {
			if (err) {
				console.error(err);
				process.exit(1);
			} else {
				console.log(`Templates for generator '${generator}' copied OK`);
			}
		}
	);
});

/**
 * @param  {String} dir [description]
 */
function mkdir(dir) {
	try {
		fs.mkdirSync(dir);
	} catch (err) {}
}
