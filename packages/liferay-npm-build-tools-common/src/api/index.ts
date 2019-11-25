/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

/**
 * This is an specialized Error class that can be thrown from any loader or
 * plugin to stop the build and signal an error to the user.
 */
export class BuildError extends Error {
	/**
	 *
	 * @param actionInProgress what was being done while error happenned
	 *        (should start with lowercase letter).
	 * @param errorDescriptions what were the error(s) (messages should start
	 *        with lowercase letter).
	 */
	constructor(actionInProgress: string, ...errorDescriptions: string[]) {
		super();
		this._actionInProgress = actionInProgress;
		this._errorDescriptions = errorDescriptions;
		this._setBaseMessage();
	}

	get actionInProgress(): string {
		return this._actionInProgress;
	}

	set actionInProgress(actionInProgress: string) {
		this._actionInProgress = actionInProgress;
		this._setBaseMessage();
	}

	get errorDescriptions(): string[] {
		return this._errorDescriptions;
	}

	_setBaseMessage() {
		const {_actionInProgress, _errorDescriptions} = this;

		this.message =
			_errorDescriptions.length > 1
				? `Build errors while ${_actionInProgress}:\n` +
				  _errorDescriptions.map(e => `  · ${e}`).join('\n')
				: `Build error while ${_actionInProgress}: ${_errorDescriptions[0]}`;
	}

	private _actionInProgress: string;
	private _errorDescriptions: string[];
}

/**
 * Compose base Error message given the descriptions.
 */
function composeBaseMessage(
	actionInProgress: string,
	...errorDescriptions: string[]
) {}
