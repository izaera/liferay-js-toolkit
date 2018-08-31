/**
 * This is the main entry point of the portlet. It receives a hash of values
 * describing the context of execution. The values are:
 *
 *   - portletElementId:
 *   		The id of the DOM node which acts as a container for the portlet.
 *   		Usually you will want to attach any generated HTML code to this
 * 			node.
 *
 *   - portletNamespace:
 *   		Portlet namespace, which is the unique identifier for this portlet
 *   		instance.
 *
 *   - contextPath:
 *   		The absolute path portion to this module's resources. It starts with
 *   		'/' and doesn't contain the protocol, host, port or authentication
 *   		values. Just the path.
 *
 * @param  {Object} params a hash with values of interest to the portlet:
 * @return {void}
 */

module.exports = function(params) {
  var out = document.getElementById(params.portletElementId);

  out.innerHTML =
    "Porlet Namespace: " +
    params.portletNamespace +
    "<br/>" +
    "Context Path: " +
    params.contextPath +
    "<br/>" +
    "Portlet Element Id: " +
    params.portletElementId;
};
