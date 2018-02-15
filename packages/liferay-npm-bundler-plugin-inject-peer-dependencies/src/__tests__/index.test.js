import plugin from '../index';

const fixturesDir =
	`${process.cwd()}/packages/` +
	`liferay-npm-bundler-plugin-inject-peer-dependencies/` +
	`src/__tests__/packages`;

// beforeAll(() => {
// 	process.chdir(fixturesDir);
// });
//
// afterAll(() => {
// 	process.chdir(processDir);
// });

it('injects rxjs peer dependency in @angular/forms', () => {
	const pkg = {
		id: '@angular/forms@1.0.0',
		name: '@angular/forms',
		version: '1.0.0',
		dir: `${fixturesDir}/@angular%2Fforms@1.0.0`,
	};
	const config = {};
	const pkgJson = require(`${pkg.dir}/package.json`);

	plugin({pkg, config}, {pkgJson});

	expect(pkgJson).toHaveProperty('dependencies');
	expect(pkgJson.dependencies).toHaveProperty('rxjs');
	expect(pkgJson.dependencies['rxjs']).toEqual('2.3.4');
});

it('uses the nearest version constraints found in the peer dependencies hierarchy', () => {
	/*
	O sea:

	si A -p-> B -p-> C para obtener Z
	y B -> Z
	y C -> Z
	entonces se usa la semver de Z en B
	*/
});

it('warns when a peer dependency has no match', () => {});

it('warns when a peer dependency has several matches', () => {});
