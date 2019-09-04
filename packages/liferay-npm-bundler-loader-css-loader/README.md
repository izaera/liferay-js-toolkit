# liferay-npm-bundler-loader-css-loader

> A liferay-npm-bundler loader that turns CSS files into JavaScript modules that
> inject a <link> into the HTML when they are required.

## Installation

```sh
npm install --save-dev liferay-npm-bundler-loader-css-loader
```

## Usage

In order to use this loader you must declare a rule in your module's `.npmbundlerrc` file:

```json
{
	"rules": [
		{
			"test": "\\.css$",
			"use": ["css-loader"]
		}
	]
}
```

See the project's wiki for more information on
[how to use build rules](https://github.com/liferay/liferay-js-toolkit/wiki/How-to-use-build-rules).
