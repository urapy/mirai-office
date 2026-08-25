import assert from 'node:assert/strict';

import { test } from 'vitest';

import { analyzeNvidiaFeed } from '../src/companyWatch.js';

test('turns the latest official NVIDIA RSS item into a sourced child report', () => {
  const report = analyzeNvidiaFeed(
    `<?xml version="1.0"?><rss><channel><item>
      <title>NVIDIA Launches New AI Accelerator Platform</title>
      <link>https://nvidianews.nvidia.com/news/example</link>
      <description><![CDATA[The platform improves AI inference.]]></description>
      <pubDate>Mon, 24 Aug 2026 15:00:00 GMT</pubDate>
    </item></channel></rss>`,
    new Date('2026-08-25T00:00:00.000Z'),
  );

  assert.equal(report.companyName, 'NVIDIA');
  assert.equal(report.category, 'ai-product');
  assert.equal(report.status, 'live');
  assert.match(report.childMeaning, /AI/);
  assert.equal(report.sourceUrl, 'https://nvidianews.nvidia.com/news/example');
});
