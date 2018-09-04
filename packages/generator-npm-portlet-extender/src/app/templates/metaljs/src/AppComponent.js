import core from 'metal';
import JSXComponent from 'metal-jsx';

export default class AppComponent extends JSXComponent {
	render() {
        return (
            <div class="AppComponent">
				<div class="portletNamespace">
					Portlet Namespace: 
					<span class="value">{this.props.portletNamespace}</span>
				</div>

				<div class="contextPath">
					Context Path: 
					<span class="value">{this.props.contextPath}</span>
				</div>

				<div class="portletElementId">
					Portlet Element Id: 
					<span class="value">{this.props.portletElementId}</span>
				</div>
			</div>
        );
    }
}

AppComponent.PROPS = {
    portletNamespace: {
        validator: core.isString,
        value: '(unknown portletNamespace)'
    },
	contextPath: {
        validator: core.isString,
        value: '(unknown contextPath)'
    },
	portletElementId: {
		validator: core.isString,
        value: '(unknown portletElementId)'
	}
};