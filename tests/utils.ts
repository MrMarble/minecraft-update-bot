import {test} from 'uvu';
import * as assert from 'uvu/assert';
import {VersionType} from '../src/types';
import {getChangelogURL} from '../src/helpers/utils';

test('getChangelogURL', () => {
  assert.type(getChangelogURL, 'function');
  assert.is(
    getChangelogURL(VersionType.Snapshot, '20w46a'),
    'https://www.minecraft.net/en-us/article/minecraft-snapshot-20w46a'
  );
  assert.is(
    getChangelogURL(VersionType.Release, '1.16.4'),
    'https://www.minecraft.net/en-us/article/minecraft-java-edition-1-16-4'
  );
});

test.run();
