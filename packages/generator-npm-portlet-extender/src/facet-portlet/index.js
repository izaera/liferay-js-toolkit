import path from 'path';
import Generator from 'yeoman-generator';

import {Copier, NpmbundlerrcModifier, PkgJsonModifier} from '../utils';

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
				name: 'category',
				message: 'Under which category should your portlet be listed?',
				default: 'category.sample',
			},
		]);
	}

	/**
	 */
	writing() {
		const cp = new Copier(this);
		const npmbundlerrc = new NpmbundlerrcModifier(this);
		const pkgJson = new PkgJsonModifier(this);

		npmbundlerrc.modifyJson(json => {
			json['create-jar'] = json['create-jar'] || {};
			json['create-jar']['auto-deploy-portlet'] = true;
		});

		pkgJson.addDevDependency('ncp', '^2.0.0');
		pkgJson.addBuildStep('node ./scripts/copy-css');
		cp.copyFile('scripts/copy-css.js');

		pkgJson.modifyJson(json => {
			json.portlet = json.portlet || {};
			json.portlet['javax.portlet.display-name'] = json.description || '';
			json.portlet['javax.portlet.security-role-ref'] = 'power-user,user';
			json.portlet['com.liferay.portlet.instanceable'] = true;
			json.portlet[
				'com.liferay.portlet.display-category'
			] = this.answers.category;
			json.portlet['com.liferay.portlet.header-portlet-css'] =
				'/css/styles.css';
		});
		cp.copyFile('css/styles.css');
	}
}
