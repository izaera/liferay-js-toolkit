/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import PluginLogger from '../plugin-logger';

/**
 * Defines expectations and behaviour of the loader so that the bundler can
 * invoke it in a proper way.
 *
 * A loader can optionally export a `BundlerLoaderMetadata` object under the
 * `metadata` key of its exports to hint the bundler about its use.
 */
export interface BundlerLoaderMetadata {
	/**
	 * The encoding to use when passing the file content as a string to the
	 * loader.
	 *
	 * If encoding is set to null, the file content is passed as a `Buffer`
	 * object and it's the plugin's responsibility to decide which encoding to
	 * use to interpret it.
	 *
	 * Note that it is a bad idea to use `null` if you are writing a loader that
	 * interprets the content as text because that way you will have to assume
	 * an encoding which may not be the one the developer is using for her
	 * project.
	 *
	 * On the contrary, if you specify an explicit encoding which is different
	 * from the one the project is using, the bundler may take care of the
	 * conversion for you and you won't have to worry about encodings when
	 * writing your loader.
	 *
	 * By default 'utf-8' is used if the loader doesn't export any metadata or
	 * if metadata is exported but `encoding` is left `undefined`.
	 *
	 * @see BundlerLoaderContent
	 */
	encoding?: BufferEncoding | null;
}

/**
 * A bundler loader plugin entry point
 */
export interface BundlerLoaderEntryPoint<T extends BundlerLoaderContent> {
	(
		/** Context of execution */
		context: BundlerLoaderContext<T>,

		/** Configured options for the loader */
		options: object
	): BundlerLoaderReturn | Promise<BundlerLoaderReturn>;
}

/**
 * A bundler loader execution context
 */
export interface BundlerLoaderContext<T extends BundlerLoaderContent> {
	/**
	 * Content of main transformed object.
	 *
	 * @see BundlerLoaderMetadata#encoding
	 */
	content: T;

	/** Path to main transformed object (relative to project dir) */
	filePath: string;

	/** Extra artifacts */
	extraArtifacts: ExtraArtifacts<T>;

	/** A standard plugin logger to write things to the report */
	log: PluginLogger;

	/** A reference to the bundler */
	bundler: BundlerLoaderCallbacks;
}

/**
 * The content of a file processed by bundler loaders.
 *
 * @see BundlerLoaderMetadata#encoding
 */
export type BundlerLoaderContent = string | Buffer;

/**
 * Hash of extra objects to write (keys are paths relative to output
 * dir and values are the content of the file).
 *
 * @see BundlerLoaderMetadata#encoding
 */
export interface ExtraArtifacts<T extends BundlerLoaderContent> {
	[filePath: string]: T;
}

/**
 * A bunch of functions to be able to callback into the bundler to achieve
 * certain things.
 */
export interface BundlerLoaderCallbacks {
	/**
	 * Emit a new file that does not exist in the project source tree and
	 * process it as if it had been read from the same package as the current
	 * file.
	 *
	 * @param filePath path of virtual file (relative to context's package)
	 * @throws {@link Error} if the file has been already emitted
	 */
	emitVirtualFile(filePath: string, content: Buffer): Promise<void>;
}

/**
 * Bundler loader return type: a string with processed content or `undefined` if
 * content was not transformed.
 */
export type BundlerLoaderReturn = string | undefined;
