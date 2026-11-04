type Payload = Record<string, unknown>

const object = (value: unknown): Payload =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Payload : {}
const string = (value: unknown) => typeof value === 'string' ? value : ''
const identifier = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : string(value)

function eventName(value: unknown) {
  return string(value).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase()
}

export interface ProviderEvent {
  type: string
  data: Payload
  id: string
  identityKeys: string[]
  name: string
  comment: string
  messageId: string
}

export function normalizeProviderEvent(value: unknown): ProviderEvent {
  const envelope = object(value)
  const data = object(envelope.data ?? envelope.payload ?? envelope)
  const user = object(data.user ?? data.member ?? data.viewer ?? envelope.user ?? envelope.member ?? envelope.viewer)
  const rawType = eventName(envelope.event ?? envelope.type ?? envelope.eventType ?? envelope.event_name ?? data.event ?? data.type)
  const type = ['join', 'member_join', 'viewer_join', 'viewer_joined', 'member_joined', 'member'].includes(rawType)
    ? 'member'
    : ['leave', 'member_leave', 'viewer_leave', 'viewer_left', 'member_left', 'disconnect', 'member_disconnect', 'viewer_disconnect'].includes(rawType)
      ? 'leave'
    : rawType === 'chat_message' ? 'chat' : rawType
  const identityKeys = [
    user.userId, user.user_id, user.id, user.uid, user.secUid, user.sec_uid,
    user.uniqueId, user.unique_id, user.username,
    data.userId, data.user_id, data.uid, data.uniqueId, data.unique_id, data.user_unique_id,
  ].map(identifier).filter(Boolean).map((key) => key.startsWith('@') ? key.slice(1).toLowerCase() : key.toLowerCase())
  const id = identityKeys[0] ?? ''
  const name = string(
    user.nickname ?? user.displayName ?? user.display_name ?? user.uniqueId ?? user.unique_id ?? user.username
      ?? data.nickname ?? data.displayName ?? data.display_name ?? data.uniqueId ?? data.unique_id ?? data.username,
  )
  const messageId = identifier(data.msgId ?? data.msg_id ?? object(data.common).msgId ?? envelope.msgId ?? envelope.id)
  const comment = string(data.comment ?? data.message ?? data.text)
  return { type, data, id, identityKeys: [...new Set(identityKeys)], name, comment, messageId }
}

export function resolveProviderViewerId(
  identityKeys: string[],
  aliases: Map<string, string>,
  seatedIds: Set<string>,
  fallbackId: string,
) {
  for (const key of identityKeys) {
    const knownId = aliases.get(key)
    if (knownId) return knownId
  }
  for (const key of identityKeys) {
    if (seatedIds.has(key)) return key
  }
  return fallbackId
}