import fs from 'fs';
import {getPackageTargetDir} from 'liferay-npm-build-tools-common/lib/packages';
import path from 'path';
import readJsonSync from 'read-json-sync';
import semver from 'semver';

/**
 * @return {void}
 */
export default function({pkg}, {pkgJson}) {
	const pkgsDir = path.dirname(pkg.dir);
	const peerDependencies = collectPeerDependencies(pkgsDir, pkg);

	console.log(peerDependencies);

	if (peerDependencies.length == 0) {
		return;
	}

	// pkgJson.dependencies = pkgJson.dependencies || {};
	//
	// deps.forEach(dep => {
	// 	let dirPrefix;
	//
	// 	if (dep.indexOf('/') != -1) {
	// 		dirPrefix = `${getPackageTargetDir(dep)}@`;
	// 	} else {
	// 		dirPrefix = `${dep}@`;
	// 	}
	//
	// 	if (!pkgJson.dependencies[dep]) {
	// 		const nodeModulesDir = path.resolve(path.join(pkg.dir, '..'));
	//
	// 		for (let dir of fs.readdirSync(nodeModulesDir)) {
	// 			if (dir.startsWith(dirPrefix)) {
	// 				const depPkgJson = readJsonSync(
	// 					path.join(nodeModulesDir, dir, 'package.json')
	// 				);
	//
	// 				pkgJson.dependencies[dep] = depPkgJson.version;
	//
	// 				break;
	// 			}
	// 		}
	// 	}
	// });
}

/**
 *
 * @param  {String} pkgsDir root packages folder
 * @param  {Object} pkg a package descriptor
 * @return {Object} a hash or peer dependencies
 */
function collectPeerDependencies(pkgsDir, pkg) {
	let peerDependencies = {};

	const pkgJson = readJsonSync(path.join(pkg.dir, 'package.json'));

	if (pkgJson.peerDependencies) {
		Object.keys(pkgJson.peerDependencies).forEach(peerName => {
			const peerPkg = findPeerMatch(pkgsDir, pkgJson, peerName);

			if (peerPkg && !peerDependencies[peerPkg]) {
				const peerPkgJson = cachedReadJsonSync(
					path.join(peerPkg.dir, 'package.json')
				);

				peerDependencies[peerPkg] = peerPkgJson.dependencies;

				peerDependencies = Object.assign(
					peerDependencies,
					collectPeerDependencies(pkgsDir, peerPkg)
				);
			}
		});
	}

	return peerDependencies;
}

/**
 * [findPeerMatch description]
 * @param  {[type]} pkgsDir               [description]
 * @param  {[type]} pkgJson               [description]
 * @param  {[type]} peerName [description]
 * @return {[type]}                        [description]
 */
function findPeerMatch(pkgsDir, pkgJson, peerName) {
	const candidates = resolvePackages(pkgsDir, peerName);

	const peerVersionConstraints = pkgJson.peerDependencies[peerName];

	const matches = candidates.filter(candidate =>
		semver.satisfies(candidate.version, peerVersionConstraints)
	);

	if (matches.length == 1) {
		return matches[0];
	}

	console.warn(
		'WARNING: Peer dependency',
		peerName,
		'of',
		`${pkgJson.name}@${pkgJson.version}`,
		'cannot be satisfied;',
		matches.length,
		'out of',
		candidates.length,
		'candidates match',
		peerVersionConstraints
	);

	return null;
}

/**
 * [resolvePackages description]
 * @param  {[type]} pkgsDir [description]
 * @param  {[type]} name    [description]
 * @return {[type]}         [description]
 */
function resolvePackages(pkgsDir, name) {
	const dirs = fs.readdirSync(pkgsDir).filter(pkgDir => {
		let pkgJson = cachedReadJsonSync(
			path.join(pkgsDir, pkgDir, 'package.json')
		);

		return pkgJson.name == name;
	});

	return dirs.map(dir => {
		let pkgJson = cachedReadJsonSync(
			path.join(pkgsDir, dir, 'package.json')
		);

		return makePackageDescriptor(pkgsDir, name, pkgJson.version);
	});
}

/**
 * [makePackageDescriptor description]
 * @param  {[type]} pkgsDir [description]
 * @param  {[type]} name    [description]
 * @param  {[type]} version [description]
 * @return {[type]}         [description]
 */
function makePackageDescriptor(pkgsDir, name, version) {
	const dir = path.join(pkgsDir, getPackageTargetDir(name, version));

	const id = `${name}@${version}`;

	return {
		name,
		version,
		dir,
		id,
		toString: () => `pkg:${id}`,
	};
}

/**
 * [cachedReadJsonSync description]
 * @param  {[type]} pkgJsonPath [description]
 * @return {[type]}      [description]
 */
function cachedReadJsonSync(pkgJsonPath) {
	// TODO: cache reads
	return readJsonSync(path.resolve(pkgJsonPath));
}
