/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import fs from 'fs-extra';
import {BuildError} from 'liferay-npm-build-tools-common/lib/api';
import {
	error,
	info,
	warn,
	success,
} from 'liferay-npm-build-tools-common/lib/format';
import project from 'liferay-npm-build-tools-common/lib/project';
import path from 'path';
import pretty from 'pretty-time';
import readJsonSync from 'read-json-sync';
import semver from 'semver';

import {addPackageDependencies, getRootPkg} from './dependencies';
import * as insight from './insight';
import createJar from './jar';
import manifest from './manifest';
import out from './out';
import report from './report';

import copyPackages from './steps/copy';
import runRules from './steps/rules';
import transformPackages from './steps/transform';

/**
 * Default entry point for the liferay-npm-bundler.
 * @param {Array} args command line arguments
 * @return {void}
 */
export default function(args) {
	if (args[0] === '-h' || args[0] === '--help') {
		console.log(
			'Usage:',
			'liferay-npm-bundler',
			'[-h|--help]',
			'[-v|--version]',
			'[-r|--dump-report]',
			'[-j|--create-jar]',
			'[--no-tracking]'
		);
		return;
	}

	const versionsInfo = project.versionsInfo;

	if (args[0] === '-v' || args[0] === '--version') {
		versionsInfo.forEach((value, key) => {
			console.log(`"${key}":`, JSON.stringify(value, null, 2));
		});
		return;
	}

	report.versionsInfo(versionsInfo);

	if (project.misc.noTracking) {
		run();
	} else {
		out.verbose(
			info`The tool is sending usage statistics to our remote servers.`
		);
		insight.init().then(run);
	}
}

/**
 * Real tool execution
 * @return {void}
 */
function run() {
	try {
		const start = process.hrtime();

		// Get root package
		const rootPkg = getRootPkg();

		report.rootPackage(rootPkg);

		// Compute dependency packages
		let depPkgs = addPackageDependencies(
			{},
			project.dir.asNative,
			project.copy.includedDependencies
		);

		depPkgs = Object.values(depPkgs).filter(pkg => !pkg.isRoot);

		report.dependencies(depPkgs);
		reportLinkedDependencies(project.pkgJson);

		// Report rules config
		report.rulesConfig(project.rules.config);

		// Do things
		copyPackages(rootPkg, depPkgs)
			.then(() => runRules(rootPkg, depPkgs))
			.then(() => transformPackages(rootPkg, depPkgs))
			.then(() => manifest.save())
			.then(() => (project.jar.supported ? createJar() : undefined))
			.then(() => {
				// Send report analytics data
				report.sendAnalytics();

				// Notify about warnings
				if (report.warningsPresent) {
					const tip = project.misc.reportFile
						? `we recommend reviewing the report file for any potential errors`
						: `we recommend adding the 'dump-report' option to '.npmbundlerrc' and running the build again`;

					out(
						warn`The bundling process has emitted some warning messages: ${tip}`
					);
				}

				// Warn about incremental builds
				if (manifest.loadedFromFile) {
					out.verbose(
						info`The bundler has run an incremental build: if anything fails try rebuilding from scratch before debugging`
					);

					report.warn(
						'This report is from an incremental build: some steps may be ' +
							'missing (you may remove the output directory to force a ' +
							'full build).'
					);
				}

				// Write report if requested
				if (project.misc.reportFile) {
					fs.writeFileSync(
						project.misc.reportFile.asNative,
						report.toHtml()
					);

					out(
						info`Report written to ${project.misc.reportFile.asNative}`
					);
				}

				// Report and show execution time
				const hrtime = process.hrtime(start);
				report.executionTime(hrtime);
				out([success`Bundling took ${pretty(hrtime)}`]);
			})
			.catch(abort);
	} catch (err) {
		abort(err);
	}
}

/**
 * Report linked dependencies of a given package.json
 * @param  {Object} pkgJson pacakge.json file contents
 * @return {void}
 */
function reportLinkedDependencies(pkgJson) {
	['dependencies', 'devDependencies'].forEach(scope => {
		if (pkgJson[scope] != null) {
			Object.keys(pkgJson[scope]).forEach(depName => {
				const depVersion = pkgJson[scope][depName];

				if (semver.validRange(depVersion) == null) {
					const depPkgJsonPath = path.join(
						'node_modules',
						depName,
						'package.json'
					);

					const depPkgJson = readJsonSync(depPkgJsonPath);

					pkgJson[scope][depName] = depPkgJson.version;

					report.linkedDependency(
						depName,
						depVersion,
						depPkgJson.version
					);
				}
			});
		}
	});
}

/**
 * Abort execution showing error message
 * @param  {Object} err the error object
 * @return {void}
 */
function abort(err) {
	if (err instanceof BuildError) {
		const {actionInProgress, errorDescriptions} = err;

		let msgs;

		if (errorDescriptions.length > 1) {
			msgs = [
				error`Bundling errors while ${actionInProgress}:`,
				'',
				...errorDescriptions.map(desc => `{  · ${desc}}`),
			];
		} else {
			msgs = [
				error`Bundling error while ${actionInProgress}: ` +
					`{${errorDescriptions[0]}}`,
			];
		}

		out.always(['', '', ...msgs, '', '']);
	} else {
		out.always([
			'',
			'',
			error`Unhandled ${err}`,
			err.stack
				.split('\n')
				.slice(1)
				.join('\n'),
			'',
			'',
		]);
	}

	process.exit(1);
}
