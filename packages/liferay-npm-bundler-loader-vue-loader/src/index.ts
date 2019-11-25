/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import * as VueComponentCompilerUtils from '@vue/component-compiler-utils';
import {VueTemplateCompiler} from '@vue/component-compiler-utils/dist/types';
import {BuildError} from 'liferay-npm-build-tools-common/lib/api';
import {
	BundlerLoaderContext,
	BundlerLoaderReturn,
} from 'liferay-npm-build-tools-common/lib/api/loaders';
import project from 'liferay-npm-build-tools-common/lib/project';
import * as compiler from 'vue-template-compiler';

/** Configuration options for `vue-loader` loader */
export interface Options {}

/**
 * A loader to process
 * [Vue SFC files](https://github.com/vuejs/vue-loader/blob/master/docs/spec.md)
 */
export default async function(
	context: BundlerLoaderContext<string>,
	options: Options
): Promise<BundlerLoaderReturn> {
	const {content, filePath, log} = context;

	// Parse Vue SFC file
	const descriptor = VueComponentCompilerUtils.parse({
		source: content,
		filename: filePath,
		compiler: compiler as VueTemplateCompiler,
		sourceRoot: project.dir.asNative,
		needMap: false,
	});

	checkUnsupportedFeatures(context, descriptor);

	await emitJavaScriptArtifact(context, descriptor);
	await emitStyleArtifacts(context, descriptor);

	log.info('vue-loader', 'Compiled file');

	return undefined;
}

/** Check unsupported features in Vue SFC files and act accordingly */
function checkUnsupportedFeatures(
	context: BundlerLoaderContext<string>,
	descriptor: VueComponentCompilerUtils.SFCDescriptor
): void {
	const {filePath, log} = context;

	// Fail build on src imports
	if (
		descriptor.template.src ||
		descriptor.script.src ||
		descriptor.styles.some(s => s.src)
	) {
		throw new BuildError(
			`processing '${filePath}'`,
			'src imports are not yet supported'
		);
	}

	// Warn about custom blocks
	if (descriptor.customBlocks && descriptor.customBlocks.length > 0) {
		log.warn(
			'vue-loader',
			'Custom blocks are not supported: your component may not work'
		);
	}
}

/** Emit the JavaScript artifact associated to the .vue file */
async function emitJavaScriptArtifact(
	context: BundlerLoaderContext<string>,
	descriptor: VueComponentCompilerUtils.SFCDescriptor
): Promise<void> {
	const {bundler, filePath} = context;

	const templateCode = getTemplateCode(context, descriptor);
	const scriptCode = getScriptCode(context, descriptor);

	// Run loaders on compiled template plus script source code
	const jsFilePath = `${filePath}.js`;

	const finalCode = `
${templateCode}
${scriptCode}
exports.default = Object.assign(
	{
		render,
		staticRenderFns
	}, 
	exports.default
);
`;

	await bundler.emitVirtualFile(jsFilePath, Buffer.from(finalCode, 'utf-8'));
}

/** Emit the style artifact associated to the .vue file */
async function emitStyleArtifacts(context, descriptor): Promise<void> {
	const {bundler, filePath, log} = context;
	const {styles} = descriptor;

	for await (const style of styles) {
		// Ignore scoped styles
		if (style.scoped) {
			log.warn(
				'vue-loader',
				'Scoped styles are not supported: your component may look bad'
			);

			return;
		}

		// Ignore module styles
		if (style.module) {
			log.warn(
				'vue-loader',
				'Module styles are not supported: your component may look bad'
			);

			return;
		}

		// Translate style
		const lang = style.lang || 'css';
		const styleFilePath = `${filePath}.${lang}`;

		bundler.emitVirtualFile(
			styleFilePath,
			Buffer.from(style.content, 'utf-8')
		);
		// const subContext = await runLoaders(
		// 	project.rules.loadersForFile(styleFilePath),
		// 	Buffer.from(style.content, 'utf-8'),
		// 	styleFilePath,
		// 	context.bundler
		// );

		// TODO: handle diversions (f.e: of SCSS files)
		// console.log(subContext);

		// if (subContext.content !== undefined) {
		// 	extraArtifacts[styleFilePath] = extraArtifacts[styleFilePath] || '';
		// 	extraArtifacts[styleFilePath] += subContext.content.toString(
		// 		'utf-8'
		// 	);
		// 	extraArtifacts[styleFilePath] += '\n';
		// }

		// Object.entries(subContext.extraArtifacts).forEach(
		// 	([extraPath, extraContent]) => {}
		// );
	}
}

/** Get the <script>'s section code */
function getScriptCode(
	context: BundlerLoaderContext<string>,
	descriptor: VueComponentCompilerUtils.SFCDescriptor
): string {
	const {script} = descriptor;

	return script.content
		.split('\n')
		.filter(line => line != '//')
		.join('\n');
}

/** Get the <template>'s section code after compilation */
function getTemplateCode(
	context: BundlerLoaderContext<string>,
	descriptor: VueComponentCompilerUtils.SFCDescriptor
): string {
	const {filePath, log} = context;

	// Get template source code
	const {template} = descriptor;
	const templateSource = template.content;

	// Compile template source code
	const {code, tips, errors} = VueComponentCompilerUtils.compileTemplate({
		source: templateSource,
		filename: filePath,
		compiler: compiler as VueTemplateCompiler,
	});

	// On errors, fail build
	if (errors && errors.length > 0) {
		const causes = errors.map(error => {
			if (typeof error !== 'string') {
				const {msg, start, end} = error;

				const frame = compiler.generateCodeFrame(
					templateSource,
					start,
					end
				);

				error = `${msg} [at ${frame}]`;
			}

			return error;
		});

		throw new BuildError(`processing '${filePath}'`, ...causes);
	}

	// Dump tips to report
	if (tips && tips.length > 0) {
		log.warn(
			'vue-loader',
			`Compiler returned some tips:\n` +
				tips
					.map(tip => {
						if (typeof tip !== 'string') {
							tip = tip.msg;
						}

						return `  · ${tip}`;
					})
					.join('\n')
		);
	}

	return code;
}
