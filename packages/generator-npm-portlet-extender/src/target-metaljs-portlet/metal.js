import path from 'path';
import Generator from 'yeoman-generator';

import dependenciesJson from './dependencies.json';
import importsJson from './imports.json';
import {
	Copier,
	NpmbundlerrcModifier,
	PkgJsonModifier,
	StylesCssModifier,
} from '../utils';

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
				name: 'importMetaljs',
				message:
					'Do you want to import Metal.js packages from Liferay?',
				default: true,
			},
		]);
	}

	/**
	 */
	writing() {
		const cp = new Copier(this);
		const npmbundlerrc = new NpmbundlerrcModifier(this);
		const pkgJson = new PkgJsonModifier(this);
		const stylesCss = new StylesCssModifier(this);

		if (this.answers.importMetaljs) {
			npmbundlerrc.mergeImports(importsJson);
			npmbundlerrc.addExclusion('incremental-dom');
			npmbundlerrc.addExclusion('incremental-dom-string');
		}

		pkgJson.mergeDependencies(dependenciesJson);
		pkgJson.addBuildStep('babel --source-maps -D -d build src');
		cp.copyFile('.babelrc');

		pkgJson.setMain('index.js');
		cp.copyDir('src');

		stylesCss.addRule('.tag', 'font-weight: bold;');
		stylesCss.addRule('.value', 'font-style: italic;');
	}
}
