/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import fs from 'fs-extra';
import {
	BundlerLoaderContent,
	BundlerLoaderContext,
} from 'liferay-npm-build-tools-common/lib/api/loaders';
import {info} from 'liferay-npm-build-tools-common/lib/format';
import * as gl from 'liferay-npm-build-tools-common/lib/globs';
import PkgDesc from 'liferay-npm-build-tools-common/lib/pkg-desc';
import {BuildError} from 'liferay-npm-build-tools-common/lib/api';
import PluginLogger from 'liferay-npm-build-tools-common/lib/plugin-logger';
import project from 'liferay-npm-build-tools-common/lib/project';
import {BundlerLoaderDescriptor} from 'liferay-npm-build-tools-common/lib/project/rules';
import path from 'path';

import out from '../out';
import report from '../report';
import {findFiles, getDestDir, runInChunks} from './util';

/**
 * Run configured rules.
 * @param rootPkg the root package descriptor
 * @param depPkgs dependency package descriptors
 */
export default async function runRules(
	rootPkg: PkgDesc,
	depPkgs: PkgDesc[]
): Promise<void> {
	const dirtyPkgs = [rootPkg, ...depPkgs].filter(srcPkg => !srcPkg.clean);

	await Promise.all(dirtyPkgs.map(srcPkg => processPackage(srcPkg)));

	out.verbose(info`Applied rules to ${dirtyPkgs.length} packages`);
}

/** Process a whole package */
function processPackage(srcPkg: PkgDesc): Promise<void> {
	out.verbose(info`Applying rules to package '${srcPkg.id}'...`);

	const sourceGlobs = srcPkg.isRoot
		? project.sources.map(source =>
				fs.statSync(project.dir.join(source).asNative).isDirectory()
					? `${source.asPosix}/**/*`
					: source.asPosix
		  )
		: ['**/*'];

	const globs = [...sourceGlobs, '!node_modules/**/*'];

	const sourcePrjRelPaths = findFiles(
		project.dir.asNative,
		gl.prefix(`${project.dir.asPosix}/${srcPkg.dir.asPosix}/`, globs)
	);

	const destPkg = srcPkg.clone({
		dir: getDestDir(srcPkg),
	});

	return runInChunks(
		sourcePrjRelPaths,
		project.misc.maxParallelFiles,
		0,
		prjRelPath => processFile(srcPkg, destPkg, prjRelPath)
	);
}

/**
 * Process a single package file
 *
 * @param content content of the file (if not given, it is read from filesystem)
 */
async function processFile(
	srcPkg: PkgDesc,
	destPkg: PkgDesc,
	prjRelPath: string,
	content?: Buffer
): Promise<void> {
	const loaders = project.rules.loadersForFile(prjRelPath);

	if (loaders.length == 0) {
		return;
	}

	const fileAbsPath = project.dir.join(prjRelPath).asNative;

	const log = new PluginLogger();

	const context = {
		content: content ? content : fs.readFileSync(fileAbsPath),
		filePath: prjRelPath,
		extraArtifacts: {},
		log,
		bundler: {
			emitVirtualFile: async (filePath: string, content: Buffer) => {
				log.info(
					'liferay-npm-bundler',
					`Rules emitted file: ${filePath}`
				);

				await processFile(srcPkg, destPkg, filePath, content);
			},
		},
	};

	await runLoadersFrom(loaders, 0, context);

	writeLoadersResult(srcPkg, destPkg, context);

	report.rulesRun(prjRelPath, log);

	if (log.errorsPresent) {
		report.warn(
			'There are errors for some loaders: please check details of rule ' +
				'executions.',
			{unique: true}
		);
	} else if (log.warnsPresent) {
		report.warn(
			'There are warnings for some loaders: please check details of ' +
				'rule executions.',
			{unique: true}
		);
	}
}

/**
 * Run rule loaders contained in an array starting at given index.
 *
 * @throws {@link BuildError} if the processing failed for some cause due to the
 *         user code
 */
async function runLoadersFrom(
	loaders: BundlerLoaderDescriptor[],
	firstLoaderIndex: number,
	context: BundlerLoaderContext<Buffer>
): Promise<void> {
	if (firstLoaderIndex >= loaders.length) {
		return;
	}

	const loader = loaders[firstLoaderIndex];
	const encoding = loader.metadata.encoding;

	let content;

	try {
		transformContents(true, context, encoding);

		content = await loader.exec(context, loader.options);
	} catch (err) {
		if (err instanceof BuildError) {
			err.actionInProgress += ` in '${loader.loader}'`;
		} else {
			err.message = `Loader '${loader.loader}' failed: ${err.message}`;
		}

		throw err;
	}

	if (content !== undefined) {
		context = Object.assign(context, {content});
	}

	transformContents(false, context, encoding);

	return await runLoadersFrom(loaders, firstLoaderIndex + 1, context);
}

/**
 * Transform the contents (`content` and `extraArtifacts` value fields) from
 * Buffer to string with given `encoding` or the opposite way.
 *
 * @remarks
 * This function is exported for testing purposes only.
 */
export function transformContents(
	beforeInvocation: boolean,
	context: BundlerLoaderContext<BundlerLoaderContent>,
	encoding: BufferEncoding
) {
	const {extraArtifacts, filePath} = context;

	if (beforeInvocation) {
		assertBuffer(context, 'content', filePath);
		Object.keys(extraArtifacts).forEach(key => {
			assertBuffer(extraArtifacts, key, `extra artifact ${key}`);
		});

		if (encoding === null) {
			return;
		}

		if (context.content !== undefined) {
			context.content = context.content.toString(encoding);
		}

		Object.keys(extraArtifacts).forEach(key => {
			if (extraArtifacts[key] !== undefined) {
				extraArtifacts[key] = extraArtifacts[key].toString(encoding);
			}
		});
	} else if (encoding === null) {
		assertBuffer(context, 'content', filePath);
		Object.keys(extraArtifacts).forEach(key => {
			assertBuffer(extraArtifacts, key, `extra artifact ${key}`);
		});
	} else {
		assertString(context, 'content', filePath);
		Object.keys(extraArtifacts).forEach(key => {
			assertString(extraArtifacts, key, `extra artifact ${key}`);
		});

		if (context.content !== undefined) {
			context.content = Buffer.from(context.content as string, encoding);
		}

		Object.keys(extraArtifacts).forEach(key => {
			if (extraArtifacts[key] !== undefined) {
				extraArtifacts[key] = Buffer.from(
					extraArtifacts[key] as string,
					encoding
				);
			}
		});
	}
}

/**
 * Assert that a given artifact content is of type `Buffer` and throw otherwise.
 */
function assertBuffer(object: object, field: string, what: string): void {
	if (object[field] === undefined) {
		return;
	}

	if (!(object[field] instanceof Buffer)) {
		throw new Error(
			`Expected content of ${what} to be a Buffer but was ` +
				`${typeof object[field]}`
		);
	}
}

/**
 * Assert that a given artifact content is of type `string` and throw otherwise.
 */
function assertString(object: object, field: string, what: string): void {
	if (object[field] === undefined) {
		return;
	}

	if (typeof object[field] !== 'string') {
		throw new Error(
			`Expected content of ${what} to be a string but was ` +
				`${typeof object[field]}`
		);
	}
}

/** Write result of a loaders round */
function writeLoadersResult(
	srcPkg: PkgDesc,
	destPkg: PkgDesc,
	context: BundlerLoaderContext<Buffer>
): void {
	if (context.content != undefined) {
		writeRuleFile(
			destPkg,
			srcPkg.dir.relative(project.dir.join(context.filePath)).asNative,
			context.content
		);
	}

	Object.entries(context.extraArtifacts).forEach(
		([extraPrjRelPath, content]) => {
			if (content == undefined) {
				return;
			}

			writeRuleFile(
				destPkg,
				srcPkg.dir.relative(project.dir.join(extraPrjRelPath)).asNative,
				content
			);

			context.log.info(
				'liferay-npm-bundler',
				`Rules emitted artifact: ${extraPrjRelPath}`
			);
		}
	);
}

/** Write a file generated by a rule for a given destination package */
function writeRuleFile(
	destPkg: PkgDesc,
	pkgRelPath: string,
	content: Buffer
): void {
	if (destPkg.isRoot) {
		pkgRelPath = stripSourceDir(pkgRelPath);
	}

	const fileAbsPath = project.dir.join(destPkg.dir, pkgRelPath).asNative;

	fs.ensureDirSync(path.dirname(fileAbsPath));
	fs.writeFileSync(fileAbsPath, content);
}

/** Strip configured source prefixes from package file path */
export function stripSourceDir(pkgRelPath: string): string {
	pkgRelPath = `.${path.sep}${pkgRelPath}`;

	for (const sourcePath of project.sources.map(source => source.asNative)) {
		const prefixPath = `${sourcePath}${path.sep}`;

		if (pkgRelPath.startsWith(prefixPath)) {
			return pkgRelPath.substring(prefixPath.length);
		}
	}

	return pkgRelPath;
}
