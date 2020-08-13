/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import fs from 'fs-extra';
import {FilePath, isLocalModule} from 'liferay-js-toolkit-core';
import webpack from 'webpack';

import {
	bundlerGeneratedDir,
	bundlerWebpackDir,
	project,
} from '../../../globals';
import * as log from '../../../log';
import {abort} from '../../../util';
import {overrideWarn} from '../util';

export default function configure(): webpack.Configuration {
	// Get user's config
	const webpackConfig = project.webpackConfiguration;

	// Provide defaults
	webpackConfig.devtool = webpackConfig.devtool || 'source-map';
	webpackConfig.mode = webpackConfig.mode || 'development';

	// TODO: check if any overriden field should be smart-merged instead

	// Override entry configuration
	overrideWarn('entry', webpackConfig.entry);
	webpackConfig.entry = Object.entries(project.exports).reduce(
		(entry, [id, moduleName]) => {
			let generatedFile: FilePath;

			if (isLocalModule(moduleName)) {
				generatedFile = exportLocalModule(id, moduleName);
			} else {
				generatedFile = exportDependencyModule(id, moduleName);
			}

			entry[id] = `./${generatedFile.asPosix}`;

			log.debug(`Generated entry point with id ${id} for ${moduleName}`);

			return entry;
		},
		{}
	);

	if (Object.keys(webpackConfig.entry).length === 0) {
		abort(
			'Please configure at least one export in the project ' +
				`(or add a 'main' entry to your package.json, or create an ` +
				`'index.js' file in the project's folder)`
		);
	}

	// Override output configuration
	overrideWarn('output', webpackConfig.output);
	webpackConfig.output = {
		filename: '[name].bundle.js',
		path: bundlerWebpackDir.asNative,
	};

	// Override optimization configuration
	overrideWarn('optimization', webpackConfig.optimization);
	webpackConfig.optimization = {
		runtimeChunk: {
			name: 'runtime',
		},
		splitChunks: {
			chunks: 'initial',
			name: 'vendor',
		},
	};

	// Insert our imports loader in first position
	webpackConfig.module = webpackConfig.module || {rules: []};
	webpackConfig.module.rules.unshift({
		enforce: 'post',
		test: /.*/,
		use: [require.resolve('./plugin/imports-loader')],
	});

	// Write webpack.config.js for debugging purposes
	fs.writeFileSync(
		bundlerGeneratedDir.join('webpack.config.json').asNative,
		JSON.stringify(webpackConfig, null, '\t')
	);

	return webpackConfig;
}

/**
 * Create a webpack entry point for a module living in node_modules.
 *
 * @param id webpack bundle id
 * @param moduleName node module name to export
 */
function exportDependencyModule(id: string, moduleName: string): FilePath {
	const generatedFile = bundlerGeneratedDir.join(`${id}.js`);

	// TODO: check if file needs regeneration to avoid webpack rebuilds

	fs.writeFileSync(
		generatedFile.asNative,
		`__MODULE__.exports = require('${moduleName}');`
	);

	return generatedFile;
}

/**
 * Create a webpack entry point for a module living in the project source dir.
 *
 * @param id webpack bundle id
 * @param moduleName node module name to export
 */
function exportLocalModule(id: string, moduleName: string): FilePath {
	const relativeModuleName = moduleName.replace('./', '');

	// TODO: check if file needs regeneration to avoid webpack rebuilds

	const bundlerGeneratedDirRelativeModuleFile = bundlerGeneratedDir.relative(
		project.sourceDir.join(new FilePath(relativeModuleName, {posix: true}))
	);

	const generatedFile = bundlerGeneratedDir.join(`${id}.js`);

	fs.writeFileSync(
		generatedFile.asNative,
		`__MODULE__.exports = require('${bundlerGeneratedDirRelativeModuleFile.asPosix}');`
	);

	return project.dir.relative(generatedFile);
}
