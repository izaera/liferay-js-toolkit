import Generator from 'yeoman-generator';

/**
 *
 */
export default class extends Generator {
	/**
	 *
	 */
	initializing() {
		this.composeWith(require.resolve('../facet-project'));
		this.composeWith(require.resolve('../facet-deploy'));
		this.composeWith(require.resolve('./export-bundle'));
	}

	/**
	 */
	install() {
		this.installDependencies({
			bower: false,
		});
	}
}
