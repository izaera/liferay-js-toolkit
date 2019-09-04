/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

/**
 * @param {object} context loader's context
 */
export default function(context, {rewrite = '(.*)', as = '$1'}) {
	const {filePath, log} = context;

	const href = filePath.replace(new RegExp(rewrite), as);

	context.extraArtifacts[`${filePath}.js`] = `
var link = document.createElement("link");
link.setAttribute("rel", "stylesheet");
link.setAttribute("type", "text/css");
link.setAttribute("href", "${href}");
document.querySelector("head").appendChild(link);
`;

	log.info('css-loader', `Generated .js module to inject '${href}'`);
}
