/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {
	BundlerLoaderContext,
	BundlerLoaderReturn,
} from 'liferay-npm-build-tools-common/lib/api/loaders';

import {removeWebpackHash} from './util';

/**
 * Tell the bundler we want contents as Buffer because we are not transforming
 * anything.
 */
export const metadata = {
	encoding: null,
};

/**
 * A loader that removes webpack hashes from filenames.
 *
 * @remarks
 * A webpack hash is defined as the rightmost hex number surrounded by dots in a
 * file name.
 */
export default function(
	context: BundlerLoaderContext<Buffer>
): BundlerLoaderReturn {
	const {content, filePath, extraArtifacts, log} = context;

	const newFilePath = removeWebpackHash(filePath);

	if (newFilePath === filePath) {
		log.info(
			'remove-webpack-hash',
			`No webpack hash in filename; nothing to be done`
		);

		return;
	}

	extraArtifacts[newFilePath] = content;
	context.content = undefined;

	log.info('remove-webpack-hash', `Diverting file output to ${newFilePath}`);

	return undefined;
}
