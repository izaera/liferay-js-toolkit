Liferay.Loader.define(
	'@angular/forms@4.2.6/bundles/forms.umd',
	[
		'module',
		'exports',
		'require',
		'@angular/core',
		'rxjs/observable/forkJoin',
		'rxjs/observable/fromPromise',
		'rxjs/operator/map',
		'@angular/platform-browser',
	],
	function(module, exports, require) {
		/*
     * There should be a lot of code here but, as we are not using it for the
     * tests, we omit it and leave a simple console.log.
     */

		console.log(
			'Hi there. Here\'s a module: ',
			require('rxjs/observable/forkJoin')
		);
	}
);
