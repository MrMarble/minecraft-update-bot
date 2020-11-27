import {config} from 'dotenv';
import {loop} from './helpers/functions';

(async () => {
  config(); // Load .env file
  console.log('Minecraft version bot started');
  await loop();
})();
