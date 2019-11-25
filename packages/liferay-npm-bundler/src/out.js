/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {print} from 'liferay-npm-build-tools-common/lib/format';
import project from 'liferay-npm-build-tools-common/lib/project';

/**
 * Log message unless `project.misc.silent` is true.
 * @return {void}
 */
export default function out(...args) {
	if (!project.misc.silent) {
		print(...args);
	}
}

/**
 * Log message regardless of what `project.misc.verbose` and
 * `project.misc.silent` are.
 * @return {void}
 */
out.always = function(...args) {
	print(...args);
};

/**
 * Log message if `project.misc.verbose` is true and `project.misc.silent` is
 * false.
 * @return {void}
 */
out.verbose = function(...args) {
	if (!project.misc.silent && project.misc.verbose) {
		print(...args);
	}
};
