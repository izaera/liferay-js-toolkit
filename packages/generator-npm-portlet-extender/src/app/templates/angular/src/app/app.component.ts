import { Component } from '@angular/core';

import LiferayParams from '../types/LiferayParams'

// TODO: extract markup to an HTML file
@Component({
	template: `
		<div class="AppComponent">
		  <div class="portletNamespace">
			  Portlet Namespace: 
			  <span class="value">{{params.portletNamespace}}</span>
		  </div>

		  <div class="contextPath">
			  Context Path: 
			  <span class="value">{{params.contextPath}}</span>
		  </div>

		  <div class="portletElementId">
			  Portlet Element Id: 
			  <span class="value">{{params.portletElementId}}</span>
		  </div>
		</div>
	`,
})
export class AppComponent {
	params: LiferayParams;
}
