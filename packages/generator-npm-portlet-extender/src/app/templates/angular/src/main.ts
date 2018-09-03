import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppComponent } from './app/app.component';
import { AppModule } from './app/app.module';
import { DynamicLoader } from './app/dynamic.loader';

/**
 * This is the actual method that initializes the portlet. It is invoked by the 
 * "bootstrap" module.
 * 
 * @param  {string} rootId The id of the DOM node which acts as a container for 
 * 							the portlet. Usually you will want to attach you 
 * 							main component to this node.
 */
export default function(rootId: string) {
	platformBrowserDynamic()
		.bootstrapModule(AppModule)
		.then((injector: any) => {
			// Load the bootstrap component dinamically so that we can attach it
			// to the portlet's DOM, which is different for each portlet
			// instance and, thus, cannot be determined until the page is
			// rendered (during runtime).
			const dynamicLoader = new DynamicLoader(injector);
			const node = document.getElementById(rootId);

			dynamicLoader.loadComponent(AppComponent, node);
		});
}
