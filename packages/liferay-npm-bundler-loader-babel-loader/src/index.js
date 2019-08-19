/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import * as babel from 'babel-core';
import resolveModule from 'resolve';

/**
 * @param {object} context loader's context
 * @param {object} config a .babelrc like configuration object
 * @return {string} the processed file content
 */
export default function(context, config) {
	const {content, filePath, log, sourceMap} = context;

	const babelConfig = Object.assign(
		{
			filenameRelative: filePath,
			inputSourceMap: sourceMap,
		},
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

	const result = babel.transform(content, babelConfig);

	context.sourceMap = result.map;
	context.extraArtifacts[`${filePath}.map`] = JSON.stringify(result.map);

	log.info('babel-loader', 'Transpiled file');

	return result.code;
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
					presetModule = projectRequire(presetName);
				} catch (err) {
					presetName = preset;
					presetModule = projectRequire(presetName);
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

/**
 * Require a module using the configured plugins directory.
 * @param {String} module a module name
 * @return {Object} the required module object
 */
export function projectRequire(module) {
	return require(resolveModule.sync(module, {
		basedir: '.',
	}));
}
