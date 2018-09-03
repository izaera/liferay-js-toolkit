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

		const framework = this.answers.framework;

		this.sourceRoot(path.join(__dirname, 'templates', framework));

		const capitalizedFramework = (this.answers.capitalizedFramework =
			framework.charAt(0).toUpperCase() + framework.substr(1));

		const promptForFramework = this[`_promptFor${capitalizedFramework}`];

		if (promptForFramework) {
			Object.assign(this.answers, await promptForFramework.bind(this)());
		}
	}

	/**
	 * @return {Object}
	 */
	async _promptForNone() {
		return await this.prompt([
			{
				type: 'confirm',
				name: 'useBabel',
				message:
					'Do you want to use Babel to transpile files from ES2015+ to ES5?',
				default: true,
			},
		]);
	}

	/**
	 */
	writing() {
		const writeForFramework = this[
			`_writeFor${this.answers.capitalizedFramework}`
		];

		if (!writeForFramework) {
			throw new Error(`Unsupported framework ${this.answers.framework}`);
		}

		writeForFramework.bind(this)();
	}

	/**
	 */
	_writeForNone() {
		let variant;

		if (this.answers.useBabel) {
			variant = 'es6';

			this._copyFile('.babelrc', {variant});
		} else {
			variant = 'es5';

			this._copyFile('scripts/copy-files.js', {variant});
		}

		this._copyFile('README.md');
		this._copyFile('.gitignore');

		this._copyTpl(
			'package.json',
			{
				name: this.answers.projectName,
				description: this.answers.projectDescription,
				displayCategory: this.answers.displayCategory,
			},
			{variant}
		);
		this._copyFile('.npmbundlerrc');

		this._copyFile('src/index.js', {variant});
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
	 * @param  {String} dest
	 * @param  {String} variant
	 */
	_copyTpl(src, ctx = {}, {dest, variant} = {}) {
		if (!dest) {
			dest = src;
		}

		if (variant) {
			const dirname = path.dirname(src);
			const basename = path.basename(src);

			src = path.join(dirname, `${variant}.${basename}`);
		}

		this.fs.copyTpl(
			this.templatePath(src),
			this.destinationPath(dest),
			ctx
		);
	}

	/**
	 * @param  {String} src
	 * @param  {String} dest
	 * @param  {String} variant
	 */
	_copyFile(src, {dest, variant} = {}) {
		if (!dest) {
			dest = src;
		}

		this._copyTpl(src, {}, {dest, variant});
	}
}
