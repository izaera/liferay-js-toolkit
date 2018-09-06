import fs from 'fs';
import path from 'path';

import Generator from 'yeoman-generator';

/**
 *
 */
export default class extends Generator {
	/**
	 *
	 */
	async initializing() {
		const targets = this._findTargets();

		const answers = await this.prompt([
			{
				type: 'list',
				name: 'target',
				message: 'What type of project do you want to create?',
				choices: targets,
			},
		]);

		this.composeWith(require.resolve(`../target-${answers.target}`));
	}

	/**
	 * @return {Array}
	 */
	_findTargets() {
		return fs
			.readdirSync(path.join(__dirname, '..'))
			.filter(file => file.indexOf('target-') == 0)
			.map(target => target.replace('target-', ''))
			.sort(compareTargetPriorities)
			.map(target => ({
				name: this._getTargetName(target),
				value: target,
			}));
	}

	/**
	 * @param  {string} target
	 * @return {string}
	 */
	_getTargetName(target) {
		return require(`../target-${target}/target-description.json`).name;
	}
}

/**
 *
 * @param  {string} l
 * @param  {string} r
 * @return {int}
 */
function compareTargetPriorities(l, r) {
	const ltd = require(`../target-${l}/target-description.json`);
	const rtd = require(`../target-${r}/target-description.json`);

	return ltd.priority - rtd.priority;
}
