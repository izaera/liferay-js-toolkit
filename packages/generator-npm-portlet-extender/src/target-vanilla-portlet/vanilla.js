import path from 'path';
import Generator from 'yeoman-generator';

import {Copier, PkgJsonModifier, StylesCssModifier} from '../utils';

/**
 *
 */
export default class extends Generator {
	/**
	 */
	initializing() {
		this.sourceRoot(path.join(__dirname, 'templates'));
	}

	/**
	 */
	async prompting() {
		this.answers = await this.prompt([
			{
				type: 'confirm',
				name: 'useBabel',
				message:
					'Do you want to use Babel to transpile Javascript sources?',
				default: true,
			},
		]);
	}

	/**
	 */
	writing() {
		const cp = new Copier(this);
		const pkgJson = new PkgJsonModifier(this);
		const stylesCss = new StylesCssModifier(this);

		if (this.answers.useBabel) {
			pkgJson.addDevDependency('babel-cli', '^6.26.0');
			pkgJson.addDevDependency('babel-preset-env', '^1.7.0');
			pkgJson.addBuildStep('babel --source-maps -D -d build src');
			cp.copyFile('.babelrc');
		} else {
			pkgJson.addDevDependency('ncp', '^2.0.0');
			pkgJson.addBuildStep('node ./scripts/copy-files');
			cp.copyFile('scripts/copy-files.js');
		}

		pkgJson.setMain('index.js');
		if (this.answers.useBabel) {
			cp.copyFile('src/index.babel.js', {dest: 'src/index.js'});
		} else {
			cp.copyFile('src/index.nobabel.js', {dest: 'src/index.js'});
		}

		stylesCss.addRule('.tag', 'font-weight: bold;');
		stylesCss.addRule('.value', 'font-style: italic;');
	}
}
