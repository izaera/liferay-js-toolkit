import fs from 'fs';
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
		this.answers = {};

		Object.assign(this.answers, await this._promptPortletQuestions());
		Object.assign(this.answers, await this._promptDeployQuestions());
		Object.assign(this.answers, await this._promptFrameworkQuestions());

		this.sourceRoot(
			path.join(__dirname, 'templates', this.answers.framework)
		);
	}

	/**
	 * @return {Object}
	 */
	async _promptPortletQuestions() {
		return await this.prompt([
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
		]);
	}

	/**
	 * @return {Object}
	 */
	async _promptDeployQuestions() {
		const answers = await this.prompt([
			{
				type: 'confirm',
				name: 'liferayDirPresent',
				message:
					'Do you have a local installation of Liferay for development?',
				default: true,
			},
		]);

		if (answers.liferayDirPresent) {
			return await this.prompt([
				{
					type: 'input',
					name: 'liferayDir',
					message:
						'Where is your local installation of Liferay placed?',
					// TODO: change this default
					default: '/Users/ivan/Liferay/CE/bundles',
					validate: (...args) => this._validateLiferayDir(...args),
				},
			]);
		}

		return {};
	}

	/**
	 * @return {Object}
	 */
	async _promptFrameworkQuestions() {
		let choices = [
			new Separator(),
			{name: FRAMEWORK.none, value: 'none'},
			new Separator(),
		];

		Object.keys(FRAMEWORK).forEach(key => {
			if (key === 'none') {
				return;
			}

			choices.push({name: FRAMEWORK[key], value: key});
		});

		let answers = await this.prompt([
			{
				type: 'list',
				name: 'framework',
				message: 'Do you want to use any framework in your project?',
				choices,
			},
		]);

		const framework = answers.framework;

		answers.capitalizedFramework =
			framework.charAt(0).toUpperCase() + framework.substr(1);

		const capitalizedFramework = answers.capitalizedFramework;

		const promptForFramework = this[`_promptFor${capitalizedFramework}`];

		if (promptForFramework) {
			Object.assign(answers, await promptForFramework.bind(this)());
		}

		return answers;
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

		this._copyFile('package.json', {
			variant,
			ctx: {
				name: this.answers.projectName,
				description: this.answers.projectDescription,
				displayCategory: this.answers.displayCategory,
			},
		});
		this._copyFile('.npmbundlerrc');

		if (this.answers.liferayDir) {
			this._copyFile('scripts/deploy.js', {
				ctx: {
					projectName: this.answers.projectName,
					liferayDir: this.answers.liferayDir,
				},
			});
		}

		this._copyFile('src/index.js', {variant});
	}

	/**
	 */
	_writeForAngular() {
		this._copyFile('README.md');
		this._copyFile('.gitignore');
		this._copyFile('package.json', {
			ctx: {
				name: this.answers.projectName,
				description: this.answers.projectDescription,
				displayCategory: this.answers.displayCategory,
			},
		});
		this._copyFile('tsconfig.json');
		this._copyFile('.npmbundlerrc');

		if (this.answers.liferayDir) {
			this._copyFile('scripts/deploy.js', {
				ctx: {
					projectName: this.answers.projectName,
					liferayDir: this.answers.liferayDir,
				},
			});
		}

		this._copyDir('src', {
			ctx: {projectName: this.answers.projectName},
		});
	}

	/**
	 */
	install() {
		this.installDependencies({
			bower: false,
		});
	}

	/**
	 * @param  {String} input
	 * @return {boolean}
	 */
	_validateLiferayDir(input) {
		if (!fs.existsSync(input)) {
			return 'Directory does not exist';
		}

		if (!fs.existsSync(path.join(input, 'osgi', 'modules'))) {
			return 'Directory does not look like a Liferay installation: osgi/modules directory is missing';
		}

		return true;
	}

	/**
	 * @param  {String} src
	 * @param  {Object} ctx
	 * @param  {String} dest
	 * @param  {String} variant
	 */
	_copyFile(src, {ctx = {}, dest, variant} = {}) {
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
	 * @param  {Object} ctx
	 * @param  {String} variant
	 */
	_copyDir(src, {ctx = {}, variant} = {}) {
		const files = fs.readdirSync(this.templatePath(src));

		files.forEach(file => {
			if (file === '.DS_Store') {
				return;
			}

			const filePath = path.join(src, file);

			if (fs.statSync(this.templatePath(filePath)).isDirectory()) {
				this._copyDir(filePath, {ctx, variant});
			} else {
				this._copyFile(filePath, {ctx, variant});
			}
		});
	}
}
