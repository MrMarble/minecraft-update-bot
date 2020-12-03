import {config} from 'dotenv';
import {existsSync} from 'fs';
import {versionFile} from './helpers/constants';
import {loop} from './helpers/functions';
import {getLatestVersion, writeVersionToFile} from './helpers/utils';

(async () => {
  config(); // Load .env file
  console.log('Minecraft version bot started');

  if (!existsSync(versionFile)) {
    console.log('Version file not found! Creating from latest...');
    writeVersionToFile(await getLatestVersion(), versionFile);
  }

  await loop();
})();
