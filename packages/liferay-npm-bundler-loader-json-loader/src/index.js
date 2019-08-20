/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

/**
 * @param {object} context loader's context
 * @return {string} the processed file content
 */
export default function(context) {
	const {filePath, log} = context;
	let {content} = context;

	content = content.replace(/\\/g, '\\\\');
	content = content.replace(/\n/g, '\\n');
	content = content.replace(/"/g, '\\"');

	context.extraArtifacts[`${filePath}.js`] = `
module.exports = JSON.parse("${content}");
`;

	log.info('json-loader', `Generated JavaScript JSON module`);
}
