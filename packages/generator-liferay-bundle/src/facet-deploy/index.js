import fs from 'fs';
import path from 'path';
import Generator from 'yeoman-generator';

import {promptWithConfig} from '../utils';
import {Copier} from '../utils';
import PkgJsonModifier from '../utils/modifier/package.json';

/**
 * Generator to add deploy support to projects.
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
		const answers = await promptWithConfig(this, 'facet-deploy', [
			{
				type: 'confirm',
				name: 'liferayPresent',
				message:
					'Do you have a local installation of Liferay for development?',
				default: true,
			},
		]);

		if (!answers.liferayPresent) {
			return;
		}

		this.answers = await promptWithConfig(this, 'facet-deploy', [
			{
				type: 'input',
				name: 'liferayDir',
				message: 'Where is your local installation of Liferay placed?',
				default: '/liferay',
				validate: validateLiferayDir,
			},
		]);
	}

	/**
	 * Standard Yeoman generation function
	 */
	writing() {
		if (!this.answers.liferayDir) {
			return;
		}

		const cp = new Copier(this);
		const pkgJson = new PkgJsonModifier(this);

		cp.copyFile('scripts/deploy.js');

		pkgJson.addScript('deploy', 'npm run build && node ./scripts/deploy');
	}
}

/**
 * Check if a given directory path contains a valid Liferay installation.
 * @param  {String} input directory path
 * @return {boolean}
 */
function validateLiferayDir(input) {
	if (!fs.existsSync(input)) {
		return 'Directory does not exist';
	}

	if (!fs.existsSync(path.join(input, 'osgi', 'modules'))) {
		return 'Directory does not look like a Liferay installation: osgi/modules directory is missing';
	}

	return true;
}
