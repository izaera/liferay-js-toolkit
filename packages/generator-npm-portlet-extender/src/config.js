import os from 'os';
import path from 'path';
import readJsonSync from 'read-json-sync';

const cfg = readJsonSync(path.join(os.homedir(), '.npm-portlet-extender.json'));

cfg.defaultDeployDir = cfg.defaultDeployDir || '/liferay';
cfg.defaultDeployDir = path.resolve(cfg.defaultDeployDir);

/**
 * @return {String} absolute path to default deploy directory
 */
export function getDefaultDeployDir() {
	return cfg.defaultDeployDir;
}
