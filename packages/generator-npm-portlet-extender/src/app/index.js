import {Separator} from 'inquirer';
import path from 'path';
import Generator from 'yeoman-generator';

const FRAMEWORK = {
	none: 'None (just raw Javascript)',
	angular: 'Angular',
	metaljs: 'Metal.js',
	react: 'React',
	vuejs: 'Vue.js',
};

/**
 *
 */
export default class extends Generator {
	/**
	 * @param {Object} args
	 * @param {Object} opts
	 */
	constructor(args, opts) {
		super(args, opts);
	}

	/**
	 */
	async prompting() {
		this.answers = await this.prompt([
			{
				type: 'input',
				name: 'projectName',
				message: 'First of all, give a technical name to your project:',
				default: path.basename(process.cwd()),
			},
			{
				type: 'input',
				name: 'projectDescription',
				message: 'Now, give a human readable name to your project:',
				default: path.basename(process.cwd()),
			},
			{
				type: 'input',
				name: 'displayCategory',
				message: 'Under which category should your portlet be listed?',
				default: 'category.sample',
			},
			{
				type: 'list',
				name: 'framework',
				message: 'Do you want to use any framework in your project?',
				choices: [
					new Separator(),
					{name: FRAMEWORK.none, value: 'none'},
					new Separator(),
					{name: FRAMEWORK.angular, value: 'angular'},
					{name: FRAMEWORK.jquery, value: 'jquery'},
					{name: FRAMEWORK.metaljs, value: 'metaljs'},
					{name: FRAMEWORK.react, value: 'react'},
					{name: FRAMEWORK.vuejs, value: 'vuejs'},
				],
			},
		]);

		this.sourceRoot(
			path.join(__dirname, 'templates', this.answers.framework)
		);
	}

	/**
	 */
	writing() {
		this._copyFile('scripts/copy-files.js');
		this._copyFile('src/index.js');
		this._copyFile('dot.gitignore', {dest: '.gitignore'});
		this._copyFile('dot.npmbundlerrc', {dest: '.npmbundlerrc'});
		this._copyTpl(
			'_package.json',
			{
				name: this.answers.projectName,
				description: this.answers.projectDescription,
				displayCategory: this.answers.displayCategory,
			},
			{dest: 'package.json'}
		);
		this._copyFile('README.md');
	}

	/**
	 */
	install() {
		this.installDependencies({
			bower: false,
		});
	}

	/**
	 * @param  {String} src
	 * @param  {Object} ctx
	 * @param  {String} destination
	 */
	_copyTpl(src, ctx = {}, {dest} = {}) {
		if (!dest) {
			dest = src;
		}

		this.fs.copyTpl(
			this.templatePath(src),
			this.destinationPath(dest),
			ctx
		);
	}

	/**
	 * @param  {String} src
	 * @param  {String} destination
	 */
	_copyFile(src, {dest} = {}) {
		if (!dest) {
			dest = src;
		}

		this._copyTpl(src, {}, {dest});
	}
}
