import path from 'path';
import Generator from 'yeoman-generator';

import {Copier} from '../utils';

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
				type: 'input',
				name: 'name',
				message: 'What is the technical name of your project?',
				default: path.basename(process.cwd()),
			},
			{
				type: 'input',
				name: 'description',
				message: 'And the human readable description?',
				default: path.basename(process.cwd()),
			},
		]);
	}

	/**
	 */
	writing() {
		const cp = new Copier(this);

		cp.copyFile('README.md');
		cp.copyFile('.gitignore');
		cp.copyFile('package.json');
		cp.copyFile('.npmbundlerrc');
	}
}
