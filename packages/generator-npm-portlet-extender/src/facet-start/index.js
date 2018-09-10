import path from 'path';
import Generator from 'yeoman-generator';

import {Copier, PkgJsonModifier} from '../utils';

/**
 * Generator to add start support to projects.
 */
export default class extends Generator {
	/**
	 * Standard Yeoman initialization function
	 */
	initializing() {
		this.sourceRoot(path.join(__dirname, 'templates'));
	}

	/**
	 * Standard Yeoman prompt function
	 */
	async prompting() {
		this.answers = {};
	}

	/**
	 * Standard Yeoman generation function
	 */
	writing() {
		const cp = new Copier(this);
		const pkgJson = new PkgJsonModifier(this);

		pkgJson.addDevDependency('ejs', '^2.0.0');
		pkgJson.addDevDependency('express', '^4.0.0');
		pkgJson.addDevDependency('liferay-amd-loader', '^3.0.0');
		pkgJson.addScript('start', 'npm run build && node ./scripts/start');
		cp.copyFile('scripts/start.js');
		cp.copyDir('scripts/start');
	}
}

