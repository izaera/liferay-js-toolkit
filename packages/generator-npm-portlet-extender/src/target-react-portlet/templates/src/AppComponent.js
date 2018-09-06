import React from 'react';
import ReactDOM from 'react-dom';

export default class extends React.Component {
	render() {
		return (
            <div>
				<div>
					<span class="tag">Portlet Namespace:</span> 
					<span class="value">{this.props.portletNamespace}</span>
				</div>
				<div>
					<span class="tag">Context Path:</span> 
					<span class="value">{this.props.contextPath}</span>
				</div>
				<div>
					<span class="tag">Portlet Element Id:</span>
					<span class="value">{this.props.portletElementId}</span>
				</div>
			</div>
		);
	}	
}