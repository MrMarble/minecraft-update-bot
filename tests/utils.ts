import {test} from 'uvu';
import * as assert from 'uvu/assert';
import {Version, VersionType} from '../src/types';
import {getChangelogURL} from '../src/helpers/utils';

test('getChangelogURL', () => {
  assert.type(getChangelogURL, 'function');
  assert.is(
    getChangelogURL({type: VersionType.Snapshot, id: '20w46a'} as Version),
    'https://www.minecraft.net/en-us/article/minecraft-snapshot-20w46a'
  );
  assert.is(
    getChangelogURL({type: VersionType.Release, id: '1.16.4'} as Version),
    'https://www.minecraft.net/en-us/article/minecraft-java-edition-1-16-4'
  );
});

test.run();
