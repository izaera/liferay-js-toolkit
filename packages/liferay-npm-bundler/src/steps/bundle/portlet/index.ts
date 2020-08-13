/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import webpack from 'webpack';

import * as log from '../../../log';
import run from '../run';
import {abortWithErrors} from '../util';
import writeResults from '../write-results';
import adapt from './adapt';
import configure from './configure';

/**
 * Run configured rules.
 */
export default async function bundlePortlet(): Promise<webpack.Stats> {
	log.debug('Using webpack at', require.resolve('webpack'));

	log.info('Configuring webpack build...');

	const options = configure();

	log.info('Running webpack...');

	const stats = await run(options);

	if (stats.hasErrors()) {
		abortWithErrors(stats);
	}

	writeResults(stats);

	log.info('Adapting webpack output to Liferay platform...');

	await adapt();

	log.info('Webpack phase finished successfully');

	return stats;
}
