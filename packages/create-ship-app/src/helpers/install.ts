import spawn from 'cross-spawn';
import { yellow } from 'picocolors';

import { preCommitHooksInstaller } from 'installers';

import config from 'config';

import type { PackageManager } from 'types';

import { getOnline } from './is-online';

interface InstallArgs {
  packageManager: PackageManager;
}

export const install = async (root: string, { packageManager }: InstallArgs): Promise<void> => {
  const isOnline = await getOnline();

  preCommitHooksInstaller(root);

  return new Promise((resolve, reject) => {
    const isNpm = packageManager === 'npm';
    const args: string[] = isNpm
      ? ['install', '--ignore-scripts']
      : ['install', '--prefer-frozen-lockfile', '--ignore-scripts'];
    const command = packageManager;

    if (config.NPM_SILENT) {
      args.push('--silent');
    }

    if (!isOnline) {
      console.log(yellow('You appear to be offline.'));
      console.log();
    }

    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: root,
      env: {
        ...process.env,
        PORT: undefined,
        ADBLOCK: '1',
        NODE_ENV: 'development',
        DISABLE_OPENCOLLECTIVE: '1',
      },
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const error = { command: `${command} ${args.join(' ')}` };

        reject(new Error(JSON.stringify(error)));

        return;
      }
      resolve();
    });
  });
};
