/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import * as babel from 'babel-core';
import template from 'babel-template';
import cpr from 'cpr';
import crypto from 'crypto';
import fs from 'fs-extra';
import {
	error,
	info,
	print,
	question,
	success,
	warn,
} from 'liferay-npm-build-tools-common/lib/format';
import project from 'liferay-npm-build-tools-common/lib/project';
import path from 'path';
import readline from 'readline';

import {Renderer, runNodeModulesBin, runPkgJsonScript} from '../../util';

const indexJsNoticeHeader =
	'/*\n' +
	' THIS FILE HAS BEEN MODIFIED BY LIFERAY JS TOOLKIT !!!\n' +
	'\n' +
	' IF YOU ARE SEEING THIS MESSAGE IT MEANS THAT:\n' +
	'\n' +
	'   1) EITHER YOU ARE IN THE MIDDLE OF A BUILD\n' +
	'   2) OR A PREVIOUS BUILD CRASHED\n' +
	'\n' +
	' IF IN CASE 2, THERE SHOULD BE A BACKUP OF THE ORIGINAL FILE NAMED\n' +
	" '.index.js' IN THIS SAME DIRECTORY.\n" +
	'\n' +
	" IF YOU RUN 'yarn run build:liferay' AGAIN IT WILL ASK YOU IF YOU WANT\n" +
	' TO RESTORE IT BUT IF YOU WANT TO DO IT MANUALLY YOU CAN, TOO.\n' +
	'\n' +
	' SORRY FOR ANY INCONVENIENCE :-(\n' +
	'*/\n';

const msg = {
	askWhetherToUseBackup: [
		``,
		question`
		Do you want to restore the backup to {'src/index.js'} (y/{N})? `,
	],
	indexJsBackupPresent: `
		Fortunately, this build tool makes a backup of {'src/index.js'} to 
		{'src/.index.js'} before modifying it. 
		
		You can now restore it in case you want to.
		
		The contents of the backup follow:
		`,
	indexJsModified: [
		warn`
		The {'src/index.js'} file seems to be a modified copy of a previous
		build. This is usually caused by a previous crash.
		`,
	],
	makingBackup: [
		info`
		Making a backup of {'src/index.js'} to {'src/.index.js'} before 
		injecting {Liferay JS Toolkit}'s modifications for the build.
		`,
	],
	indexJsBackupNotPresent: [
		error`
		The modified {'src/index.js'} cannot be used for the build but an
		automatic backup was not found, meaning that probably something went
		badly wrong in a previous build.

		Please restore the {'src/index.js'} file from your version control, or
		fix it manually, to be able to deploy this project.

		We are very sorry, this should not have happened| 😢|.`,
	],
	indexJsBackupNotRestored: [
		error`
		The modified {'src/index.js'} cannot be used for the build but a backup
		was not restored. Please restore the backup or fix the {'src/index.js'} 
		file and then remove the backup {'src/.index.js'} to be able to deploy 
		this project.`,
	],
	noValidEntryPoint: [
		error`
		No valid entry point found in {'src/index.js'}. It is not possible to
		continue and deploy this project to your Liferay server.
		`,
		`
		This build tool assumes that you use a standard React entry point which
		contains one single {ReactDOM.render()} call where the second argument 
		is a {document.getElementById()} call.

		If that is not the case, you may not deploy this application to a 
		Liferay server because it will not know how to attach your UI to the
		page.
		`,
		info`
		Visit http://bit.ly/js-toolkit-wiki for more information.`,
	],
	restoringBackup: [
		info`
		Restoring backup of {'src/index.js'} after React's build has finished.
		`,
	],
	usingPreviousBackup: [
		``,
		success`
		Using previous backup of {'src/index.js'} for this build.
		`,
	],
};

const angularCliBuildDir = project.dir.join('dist', 'ng-app');
const explodedJarDir = project.dir.join('build.liferay', 'jar');
const pkgJson = project.pkgJson;
const templatesPath = path.join(
	__dirname,
	'..',
	'..',
	'resources',
	'build',
	'angular-cli'
);

const renderer = new Renderer(templatesPath, explodedJarDir.asNative);

/**
 * Test if the current project is an angular-cli project
 * @return {boolean}
 */
export function probe() {
	return project.probe.type === project.probe.TYPE_ANGULAR_CLI;
}

/**
 * Run the specialized build
 */
export function run() {
	return (
		Promise.resolve()
			// .then(() => runPkgJsonScript('build'))
			.then(copyAngularCliBuild)
			.then(generateIndexJs)
			.then(() => runNodeModulesBin('liferay-npm-bundler'))
			.catch(err => {
				if (err.humanMessage) {
					console.log();
					print(err.humanMessage);
					console.log();
				} else {
					console.error(err);
				}

				// if (!err.doNotRestoreBackup) {
				// 	restoreIndexJs();
				// }

				process.exit(1);
			})
	);
}

function copyAngularCliBuild() {
	return new Promise((resolve, reject) => {
		const angularAppDirPath = explodedJarDir.join('angular-app').asNative;

		fs.emptyDir(angularAppDirPath);

		cpr(
			angularCliBuildDir.asNative,
			angularAppDirPath,
			{confirm: true, overwrite: true},
			err => (err ? reject(err) : resolve())
		);
	});
}

function generateIndexJs() {
	const jsDirPath = angularCliBuildDir.asNative;

	const jsFilePaths = fs
		.readdirSync(jsDirPath)
		.filter(jsFilePath => jsFilePath.endsWith('-es5.js'));

	// const jsRuntimeFilePath = jsFilePaths.find(jsFilePath =>
	// 	jsFilePath.startsWith('runtime~')
	// );

	renderer.render('index.js', {
		jsFiles: jsFilePaths,
		// [
		// 	...jsFilePaths.filter(jsFile => jsFile !== jsRuntimeFilePath),
		// 	jsRuntimeFilePath,
		// ],
		pkgJson,
		webContextPath: project.jar.webContextPath,
	});
}
