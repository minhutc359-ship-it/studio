import { describe, expect, it } from 'vitest'
import { normalizeProviderEvent, resolveProviderViewerId } from './providerEvent'

describe('normalizeProviderEvent', () => {
  it('normalizes the documented member envelope', () => {
    expect(normalizeProviderEvent({
      event: 'member',
      data: { user: { uniqueId: 'viewer_one', nickname: 'Viewer One' } },
    })).toMatchObject({ type: 'member', id: 'viewer_one', name: 'Viewer One' })
  })

  it('recognizes join event aliases and type/payload envelopes', () => {
    expect(normalizeProviderEvent({
      type: 'viewerJoin',
      payload: { viewer: { user_id: 123, display_name: 'Viewer Two' } },
    })).toMatchObject({ type: 'member', id: '123', name: 'Viewer Two' })
    expect(normalizeProviderEvent({
      eventType: 'join',
      data: { user: { unique_id: 'viewer_three' } },
    })).toMatchObject({ type: 'member', id: 'viewer_three' })
  })

  it('normalizes chat message aliases without losing the comment', () => {
    expect(normalizeProviderEvent({
      type: 'chatMessage',
      payload: { user: { uniqueId: 'viewer_four' }, text: 'join' },
    })).toMatchObject({ type: 'chat', id: 'viewer_four', comment: 'join' })
  })

  it('resolves events with a different provider ID to the seated viewer through shared identity aliases', () => {
    const member = normalizeProviderEvent({
      event: 'member',
      data: { user: { userId: 456, uniqueId: 'viewer_five', nickname: 'Viewer Five' } },
    })
    const chat = normalizeProviderEvent({
      event: 'chat',
      data: { user: { uniqueId: 'viewer_five' }, comment: 'react heart' },
    })
    const aliases = new Map(member.identityKeys.map((key) => [key, member.id]))

    expect(resolveProviderViewerId(chat.identityKeys, aliases, new Set([member.id]), chat.id)).toBe(member.id)
  })

  it('keeps identity aliases canonical when a member event arrives before manual seating', () => {
    const member = normalizeProviderEvent({
      event: 'member',
      data: { user: { userId: 789, uniqueId: 'viewer_six' } },
    })
    const aliases = new Map(member.identityKeys.map((key) => [key, member.id]))
    const chat = normalizeProviderEvent({
      event: 'chat',
      data: { user: { uniqueId: 'viewer_six' }, comment: 'join' },
    })

    expect(resolveProviderViewerId(chat.identityKeys, aliases, new Set(), chat.id)).toBe(member.id)
  })
})