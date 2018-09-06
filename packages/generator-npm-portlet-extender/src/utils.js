import fs from 'fs';
import path from 'path';

/**
 */
export class Copier {
	/**
	 * @param {Generator} generator a Yeoman generator
	 */
	constructor(generator) {
		this._generator = generator;
	}

	/**
	 * @param  {String} src
	 * @param  {Object} context
	 * @param  {String} dest
	 */
	copyFile(src, {context = {}, dest} = {}) {
		const gen = this._generator;

		const fullContext = Object.assign({}, gen.answers);
		Object.assign(fullContext, context);

		dest = dest || src;

		gen.fs.copyTpl(
			gen.templatePath(src),
			gen.destinationPath(dest),
			fullContext
		);
	}

	/**
	 * @param  {String} src
	 * @param  {Object} context
	 */
	copyDir(src, {context = {}} = {}) {
		const gen = this._generator;
		const files = fs.readdirSync(gen.templatePath(src));

		files.forEach(file => {
			if (file === '.DS_Store') {
				return;
			}

			const filePath = path.join(src, file);

			if (fs.statSync(gen.templatePath(filePath)).isDirectory()) {
				this.copyDir(filePath, context);
			} else {
				this.copyFile(filePath, context);
			}
		});
	}
}

/**
 *
 */
export class JsonModifier {
	/**
	 * @param {Generator} generator a Yeoman generator
	 * @param {String} path path to file
	 */
	constructor(generator, path) {
		this._generator = generator;
		this._path = path;
	}

	/**
	 * @param  {Function} modifier [description]
	 */
	modifyJson(modifier) {
		const gen = this._generator;

		let json = JSON.parse(gen.fs.read(this._path));

		modifier(json);

		gen.fs.write(this._path, JSON.stringify(json, null, '	'));
	}
}

/**
 *
 */
export class PkgJsonModifier extends JsonModifier {
	/**
	 * @param {Generator} generator a Yeoman generator
	 */
	constructor(generator) {
		super(generator, 'package.json');
	}

	/**
	 * @param {string} module
	 */
	setMain(module) {
		this.modifyJson(json => {
			json.main = module;
		});
	}

	/**
	 * @param {String} name
	 * @param {String} semver
	 */
	addDevDependency(name, semver) {
		this.modifyJson(json => {
			json.devDependencies = json.devDependencies || {};
			json.devDependencies[name] = semver;
		});
	}

	/**
	 * @param {String} name
	 * @param {String} semver
	 */
	addDependency(name, semver) {
		this.modifyJson(json => {
			json.dependencies = json.dependencies || {};
			json.dependencies[name] = semver;
		});
	}

	/**
	 * @param  {Object} dependencies
	 */
	mergeDependencies(dependencies) {
		Object.entries(dependencies.dependencies).forEach(([name, semver]) =>
			this.addDependency(name, semver)
		);

		Object.entries(dependencies.devDependencies).forEach(([name, semver]) =>
			this.addDevDependency(name, semver)
		);
	}

	/**
	 * @param {String} command
	 */
	addBuildStep(command) {
		this.modifyJson(json => {
			json.scripts = json.scripts || {};
			json.scripts.build = json.scripts.build || '';
			json.scripts.build = `${command} && ${json.scripts.build}`;
		});
	}

	/**
	 * @param {String} name
	 * @param {String} command
	 */
	addScript(name, command) {
		this.modifyJson(json => {
			json.scripts = json.scripts || {};
			json.scripts[name] = command;
		});
	}
}

/**
 *
 */
export class NpmbundlerrcModifier extends JsonModifier {
	/**
	 * @param {Generator} generator a Yeoman generator
	 */
	constructor(generator) {
		super(generator, '.npmbundlerrc');
	}

	/**
	 * @param {Object} imports
	 */
	mergeImports(imports) {
		this.modifyJson(json => {
			json['config'] = json['config'] || {};
			json['config']['imports'] = json['config']['imports'] || {};

			Object.entries(imports).forEach(([provider, dependencies]) => {
				json['config']['imports'][provider] =
					json['config']['imports'][provider] || {};

				Object.entries(dependencies).forEach(([name, semver]) => {
					json['config']['imports'][provider][name] = semver;
				});
			});
		});
	}

	/**
	 * @param {string} name
	 * @param {Array|boolean} value
	 */
	addExclusion(name, value = true) {
		this.modifyJson(json => {
			json['exclude'] = json['exclude'] || {};
			json['exclude'][name] = value;
		});
	}
}

/**
 *
 */
export class StylesCssModifier {
	/**
	 * @param {Generator} generator a Yeoman generator
	 */
	constructor(generator) {
		this._generator = generator;
	}

	/**
	 *
	 * @param {String} selector
	 * @param {String} values
	 */
	addRule(selector, ...values) {
		const gen = this._generator;

		let css = gen.fs.read('css/styles.css');

		css += `${selector} {
${values.map(value => `	${value}`).join('\n')}
}\n\n`;

		gen.fs.write('css/styles.css', css);
	}
}
