# liferay-npm-build-tools-common/src/project

This folder contains the public API needed to load a bundler's project
configuration.

It can be used for a variety of things, like:

-   Obtaining the loaders or plugins configured for a file
-   Get the versions of the plugins involved in the build
-   Get information configured in `.npmbundlerrc`
-   ...

In general, this API must remain stable and be backward compatible.

Forward compatibility will also be maintained unless it is totally impossible
or very difficult to achieve.
