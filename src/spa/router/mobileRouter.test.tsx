import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('mobileRouter task routes', () => {
  it('registers mobile chat topics route before the dynamic topic route', async () => {
    const source = await readFile(
      path.join(process.cwd(), 'src/spa/router/mobileRouter.config.tsx'),
      'utf8',
    );

    const topicsRouteIndex = source.indexOf("path: 'topics'");
    const dynamicTopicRouteIndex = source.indexOf("path: ':topicId'");

    expect(source).toContain("import('@/routes/(main)/agent/topics')");
    expect(topicsRouteIndex).toBeGreaterThan(-1);
    expect(dynamicTopicRouteIndex).toBeGreaterThan(-1);
    expect(topicsRouteIndex).toBeLessThan(dynamicTopicRouteIndex);
  });

  it('registers task list and detail routes under the shared workspace layout', async () => {
    const source = await readFile(
      path.join(process.cwd(), 'src/spa/router/mobileRouter.config.tsx'),
      'utf8',
    );

    expect(source).toContain("import('@/routes/(main)/(task-workspace)/_layout')");
    expect(source).toContain("import('@/routes/(main)/tasks')");
    expect(source).toContain("import('@/routes/(main)/task/[taskId]')");
    expect(source).toContain("import('@/routes/(main)/agent/task/[taskId]')");
    expect(source).toContain("path: 'tasks'");
    expect(source).toContain("path: 'task'");
    expect(source).toContain("path: ':taskId'");
    expect(source).toContain("path: ':aid/task/:taskId'");
    expect(source).not.toContain("import('@/routes/(main)/tasks/_layout')");
  });
});
