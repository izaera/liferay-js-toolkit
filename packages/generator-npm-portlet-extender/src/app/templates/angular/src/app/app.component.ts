import { Component } from '@angular/core';

// TODO: add support for CSS
// TODO: extract markup to an HTML file
@Component({
	template: `
		<div>{{caption}}</div>
	`,
})
export class AppComponent {
	caption = 'Hello world from Angular!';
}
