import {fork} from 'child_process';
import {config} from 'dotenv';
import {existsSync} from 'fs';
import {versionFile} from './helpers/constants';
import {getLatestVersion, writeVersionToFile} from './helpers/utils';

(async () => {
  config(); // Load .env file
  console.log('Minecraft version bot started');

  if (!existsSync(versionFile)) {
    console.log('Version file not found! Creating from latest...');
    writeVersionToFile(await getLatestVersion(), versionFile);
  }

  const child = fork(`${__dirname}/helpers/functions.js`, {
    detached: false,
    env: {...process.env, FORK: '1'},
  });

  process.on('SIGINT', () => {
    console.info('Stopping bot...');
    child.kill(0);
  });
})();
