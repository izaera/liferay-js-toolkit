/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import * as path from 'path';

type UnboundPath = string | FilePath;
interface CtorOptions {
	posix?: boolean;
}

export default class FilePath {
	static nativeIsPosix: boolean = path.sep === '/';

	static convertArray(
		nativePathsArray: string[],
		{posix}: CtorOptions = {}
	): FilePath[] {
		const filePathsArray = nativePathsArray.map(
			nativePath => new FilePath(nativePath, {posix})
		);

		Object.defineProperty(filePathsArray, 'asNative', {
			configurable: false,
			enumerable: true,
			get: () => filePathsArray.map(filePath => filePath.asNative),
		});

		Object.defineProperty(filePathsArray, 'asPosix', {
			configurable: false,
			enumerable: true,
			get: () => filePathsArray.map(filePath => filePath.asPosix),
		});

		Object.defineProperty(filePathsArray, 'asWindows', {
			configurable: false,
			enumerable: true,
			get: () => filePathsArray.map(filePath => filePath.asWindows),
		});

		return filePathsArray;
	}

	constructor(nativePath: string, {posix}: CtorOptions = {}) {
		if (posix && !FilePath.nativeIsPosix) {
			nativePath = nativePath.replace(/\//g, '\\');
		}

		this._nativePath = nativePath;

		if (FilePath.nativeIsPosix) {
			this._posixPath = nativePath;
			this._windowsPath = nativePath.replace(/\//g, '\\');
		} else {
			this._posixPath = nativePath.replace(/\\/g, '/');
			this._windowsPath = nativePath;
		}
	}

	toString() {
		return this.asNative;
	}

	get asNative(): string {
		return this._nativePath;
	}

	get asPosix(): string {
		return this._posixPath;
	}

	get asWindows(): string {
		return this._windowsPath;
	}

	join(...nativePathFragments: UnboundPath[]): FilePath {
		const join = FilePath.nativeIsPosix ? path.posix.join : path.win32.join;

		return new FilePath(
			join(
				this.toString(),
				...nativePathFragments.map(nativePathFragment =>
					nativePathFragment.toString()
				)
			)
		);
	}

	relative(nativePath: string | FilePath): FilePath {
		return new FilePath(
			path.relative(this.asNative, nativePath.toString())
		);
	}

	_nativePath: string;
	_posixPath: string;
	_windowsPath: string;
}
