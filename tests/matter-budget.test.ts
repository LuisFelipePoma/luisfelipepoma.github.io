/// <reference types="node" />
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matterBudgets,nextMatterTier} from '../src/scripts/matter-budget.ts';

test('scroll p95 reduces density only after 60 samples and never increases it',()=>{
  assert.deepEqual(matterBudgets,[{desktop:2400,mobile:850},{desktop:1800,mobile:600},{desktop:1200,mobile:400}]);
  assert.equal(nextMatterTier(0,59,20),0);
  assert.equal(nextMatterTier(0,60,10),0);
  assert.equal(nextMatterTier(0,60,10.01),1);
  assert.equal(nextMatterTier(1,60,10.01),2);
  assert.equal(nextMatterTier(2,120,20),2);
  assert.equal(nextMatterTier(1,120,5),1);
});
