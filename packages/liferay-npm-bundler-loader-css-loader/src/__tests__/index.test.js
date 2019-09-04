/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import PluginLogger from 'liferay-npm-build-tools-common/lib/plugin-logger';
import loader from '../index';

it('logs results correctly', () => {
	const context = {
		content: '',
		filePath: 'file.css',
		log: new PluginLogger(),
		extraArtifacts: {},
	};

	loader(context, {});

	expect(context.log.messages).toEqual([
		{
			level: 'info',
			source: 'css-loader',
			things: ["Generated .js module to inject 'file.css'"],
		},
	]);
});

it('correctly generates JS module', () => {
	const context = {
		content: '',
		filePath: 'file.css',
		log: new PluginLogger(),
		extraArtifacts: {},
	};

	const result = loader(context, {});

	expect(result).toBeUndefined();

	expect(Object.keys(context.extraArtifacts)).toEqual(['file.css.js']);
	expect(eval(context.extraArtifacts['file.css.js']).outerHTML).toEqual(
		'<link rel="stylesheet" type="text/css" href="file.css">'
	);
});

it('rewrites URL correctly', () => {
	const context = {
		content: '',
		filePath: 'my/file.scss',
		log: new PluginLogger(),
		extraArtifacts: {},
	};

	loader(context, {
		rewrite: '(.*).scss$',
		as: '/path/to/$1.css',
	});

	expect(Object.keys(context.extraArtifacts)).toEqual(['my/file.scss.js']);
	expect(eval(context.extraArtifacts['my/file.scss.js']).outerHTML).toEqual(
		'<link rel="stylesheet" type="text/css" href="/path/to/my/file.css">'
	);
});
