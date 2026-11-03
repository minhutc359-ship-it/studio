import { describe, expect, it } from 'vitest'
import { providerUrl, TIKFINITY_DEFAULT } from './providerConfig'

describe('providerUrl', () => {
  it('uses the built-in TikFinity address or a secure custom bridge', () => {
    expect(providerUrl('tikfinity', '', '').href).toBe(TIKFINITY_DEFAULT)
    expect(providerUrl('tikfinity', '', 'wss://bridge.example/live').href).toBe('wss://bridge.example/live')
    expect(() => providerUrl('tikfinity', '', 'ws://bridge.example/live')).toThrow()
  })

  it('combines a TikTok channel link and JWT or API key', () => {
    const jwt = providerUrl('tiktools', 'https://www.tiktok.com/@cinema/live', 'header.payload.signature')
    expect(jwt.searchParams.get('uniqueId')).toBe('cinema')
    expect(jwt.searchParams.get('jwtKey')).toBe('header.payload.signature')
    expect(providerUrl('tiktools', '@cinema', 'test-key').searchParams.get('apiKey')).toBe('test-key')
  })

  it('accepts a complete official link and rejects foreign endpoints', () => {
    const url = providerUrl('tiktools', '', 'wss://api.tik.tools/?uniqueId=cinema&apiKey=test-key')
    expect(url.searchParams.get('uniqueId')).toBe('cinema')
    expect(() => providerUrl('tiktools', '', 'wss://api.tik.tools.example/?apiKey=test-key')).toThrow()
    expect(() => providerUrl('tiktools', '', 'wss://api.tik.tools/?uniqueId=cinema')).toThrow()
  })
})
