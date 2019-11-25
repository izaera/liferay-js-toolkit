/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import * as babel from 'babel-core';
import fs from 'fs';
import {BuildError} from 'liferay-npm-build-tools-common/lib/api';
import project from 'liferay-npm-build-tools-common/lib/project';
import readJsonSync from 'read-json-sync';

/**
 * @param {object} context loader's context
 * @param {object} config a .babelrc like configuration object
 * @return {string} the processed file content
 */
export default function(context, config) {
	const {content, filePath, log, sourceMap} = context;

	const babelRcPath = project.dir.join('.babelrc').asNative;

	const babelConfig = Object.assign(
		{
			filename: project.dir.join(filePath).asNative,
			filenameRelative: filePath,
			inputSourceMap: sourceMap,
		},
		fs.existsSync(babelRcPath) ? readJsonSync(babelRcPath) : {},
		config
	);

	// Tune babel config
	babelConfig.babelrc = false;
	babelConfig.only = '**/*';
	if (babelConfig.sourceMaps === undefined) {
		babelConfig.sourceMaps = true;
	}

	// Intercept presets and plugins to load them from project
	babelConfig.plugins = loadBabelPlugins(
		babelConfig.presets || [],
		babelConfig.plugins || []
	);
	delete babelConfig.presets;

	try {
		const result = babel.transform(content, babelConfig);
		context.sourceMap = result.map;
		context.extraArtifacts[`${filePath}.map`] = JSON.stringify(result.map);

		log.info('babel-loader', 'Transpiled file');

		return result.code;
	} catch (err) {
		throw new BuildError(
			`transpiling ${filePath}`,
			`Cause: ${err.message
				.split(': ')
				.slice(1)
				.join(': ')}`,
			`In code:\n${err.codeFrame}`
		);
	}
}

/**
 * Load Babel plugins from a given array of presets and plugins.
 * @param {Array} presets an array of Babel preset names as defined by .babelrc
 * @param {Array} plugins an array of Babel plugins names as defined by .babelrc
 * @return {Array} the instantiated Babel plugins
 */
function loadBabelPlugins(presets, plugins) {
	return []
		.concat(
			...presets.map(preset => {
				let presetModule, presetName;

				try {
					presetName = `babel-preset-${preset}`;
					presetModule = project.require(presetName);
				} catch (err) {
					presetName = preset;
					presetModule = project.require(presetName);
				}

				if (presetModule === undefined) {
					throw new Error(
						`Babel preset '${presetName}' does not export anything`
					);
				}

				if (presetModule.default !== undefined) {
					presetModule = presetModule.default;
				}

				if (
					presetModule.plugins === undefined &&
					typeof presetModule !== 'function'
				) {
					throw new Error(
						`Babel preset '${presetName}' does not export a ` +
							'valid function or plugins object'
					);
				}

				return presetModule.plugins || presetModule().plugins;
			})
		)
		.concat(plugins);
}
