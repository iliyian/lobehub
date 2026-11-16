import { describe, expect, it } from 'vitest';

import type { UIChatMessage } from '@/types/index';

import { MessagesEngine } from '../MessagesEngine';
import type { MessagesEngineParams } from '../types';

const conversation = (): UIChatMessage[] =>
  [
    { content: 'Hello', createdAt: 0, id: 'msg-1', role: 'user', updatedAt: 0 },
    { content: 'Hi there!', createdAt: 0, id: 'msg-2', role: 'assistant', updatedAt: 0 },
  ] as UIChatMessage[];

const richParams = (overrides?: Partial<MessagesEngineParams>): MessagesEngineParams => ({
  agentIdentity: { name: 'Secret Persona', title: 'Secret Role' },
  enableSystemDate: true,
  inputTemplate: 'TEMPLATE PREFIX {{text}}',
  knowledge: {
    fileContents: [{ content: 'secret knowledge', fileId: 'file-1', filename: 'secret.txt' }],
  },
  messages: conversation(),
  model: 'gpt-4',
  provider: 'openai',
  skillsConfig: {
    enabledSkills: [{ identifier: 'secret-skill', name: 'Secret Skill' } as never],
  },
  systemRole: 'You are a secret persona.',
  toolsConfig: {
    manifests: [
      {
        api: [],
        identifier: 'secret-tool',
        meta: {},
        systemRole: 'secret tool instructions',
        type: 'builtin',
      } as never,
    ],
    tools: ['secret-tool'],
  },
  userMemory: {
    enabled: true,
    memories: { contexts: [{ content: 'secret memory' }] },
  } as never,
  ...overrides,
});

describe('MessagesEngine zeroSystemPrompt (pure mode)', () => {
  it('keeps the manual system role but drops every other injection', async () => {
    const result = await new MessagesEngine(
      richParams({ zeroSystemPrompt: true }),
    ).process();

    expect(result.messages).toEqual([
      { content: 'You are a secret persona.', role: 'system' },
      { content: 'Hello', role: 'user' },
      { content: 'Hi there!', role: 'assistant' },
    ]);

    const system = result.messages[0];
    expect(system.content).toBe('You are a secret persona.');
    // No date, identity, knowledge, memory, skill or tool instructions.
    expect(system.content).not.toContain('Current date');
    expect(system.content).not.toContain('<agent_identity>');
    expect(system.content).not.toContain('secret knowledge');
    expect(system.content).not.toContain('secret memory');
    expect(system.content).not.toContain('<available_skills>');
    expect(system.content).not.toContain('<tools');
  });

  it('sends no system message when no manual instruction is configured', async () => {
    const result = await new MessagesEngine(
      richParams({ systemRole: undefined, zeroSystemPrompt: true }),
    ).process();

    expect(result.messages).toEqual([
      { content: 'Hello', role: 'user' },
      { content: 'Hi there!', role: 'assistant' },
    ]);
  });

  it('drops system rows that arrive with the conversation', async () => {
    const result = await new MessagesEngine(
      richParams({
        messages: [
          { content: 'raw system row', id: 'sys-1', role: 'system' },
          ...conversation(),
        ] as UIChatMessage[],
        systemRole: undefined,
        zeroSystemPrompt: true,
      }),
    ).process();

    expect(result.messages.map((message) => message.role)).toEqual(['user', 'assistant']);
  });

  it('keeps the normal pipeline behavior when the flag is off', async () => {
    const result = await new MessagesEngine(richParams()).process();

    const system = result.messages.find((message) => message.role === 'system');
    expect(system?.content).toContain('You are a secret persona.');
    expect(system?.content).toContain('<agent_identity>');
    expect(system?.content).toContain('Secret Persona');
    // The input template is applied to the user row outside pure mode.
    expect(result.messages.find((message) => message.role === 'user')?.content).toContain(
      'TEMPLATE PREFIX',
    );
  });
});
