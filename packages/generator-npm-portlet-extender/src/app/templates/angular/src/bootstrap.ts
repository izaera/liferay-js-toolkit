import './polyfills';

/** Liferay AMD loader */
declare var Liferay: any;

/**
 * This is the structure of the parameters passed by Liferay to the JS module.
 */
interface Params {
	/**
	 * The id of the DOM node which acts as a container for the portlet.
	 * Usually you will want to attach any generated HTML code to this node.
	 */
	portletElementId: string;

	/**
	 * Portlet namespace, which is the unique identifier for this portlet
	 * instance.
	 */
	portletNamespace: string;

	/**
	 * The absolute path portion to this module's resources. It starts with
	 * '/' and doesn't contain the protocol, host, port or authentication
	 * values. Just the path.
	 */
	contextPath: string;

}

/**
 * This is the first entry point of the portlet. It just implements a launcher
 * that triggers an asynchronous load of the main module.
 * 
 * @param  {Object} params a hash with values of interest to the portlet
 */
export default function(params: Params) {
	Liferay.Loader.require('<%= projectName %>@1.0.0/main', (main: any) => {
		// TODO: pass the whole params object
		main.default(params.portletElementId);
	});
}
