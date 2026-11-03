import type { ProviderId } from '../store'

export const TIKFINITY_DEFAULT = 'ws://localhost:21213/'
const TIKTOOLS_ENDPOINT = 'wss://api.tik.tools/'

function readUrl(value: string) {
  try { return new URL(value) } catch { return null }
}

function channelName(input: string) {
  const value = input.trim()
  const url = readUrl(value)
  const handle = url && url.protocol === 'https:' && ['tiktok.com', 'www.tiktok.com'].includes(url.hostname)
    ? url.pathname.split('/')[1] ?? ''
    : value
  const name = handle.replace(/^@/, '')
  if (!/^[a-zA-Z0-9_.]{1,32}$/.test(name)) {
    throw new Error('Nhập @username hoặc link TikTok dạng https://www.tiktok.com/@username/live.')
  }
  return name
}

export function providerUrl(provider: Exclude<ProviderId, 'mock'>, channel: string, input: string): URL {
  const value = input.trim()
  const pastedUrl = readUrl(value)
  if (provider === 'tikfinity') {
    const url = value ? pastedUrl : new URL(TIKFINITY_DEFAULT)
    if (!url || !['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
      throw new Error('Nhập địa chỉ WebSocket TikFinity bắt đầu bằng ws:// hoặc wss://.')
    }
    if (url.protocol === 'ws:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      throw new Error('WebSocket ngoài máy này cần dùng wss://.')
    }
    return url
  }

  const url = new URL(TIKTOOLS_ENDPOINT)
  if (pastedUrl) {
    if (pastedUrl.origin !== url.origin || pastedUrl.pathname !== '/' || pastedUrl.username || pastedUrl.password || pastedUrl.hash) {
      throw new Error('Dán link WebSocket chính thức bắt đầu bằng wss://api.tik.tools/.')
    }
    const jwt = pastedUrl.searchParams.get('jwtKey')?.trim()
    const key = pastedUrl.searchParams.get('apiKey')?.trim()
    if (Boolean(jwt) === Boolean(key)) throw new Error('Link TikTools cần chứa một jwtKey hoặc apiKey.')
    url.searchParams.set('uniqueId', channelName(pastedUrl.searchParams.get('uniqueId') || channel))
    url.searchParams.set(jwt ? 'jwtKey' : 'apiKey', jwt || key!)
    return url
  }

  if (!value || /\s/.test(value)) throw new Error('Nhập JWT, API key hoặc link WebSocket của TikTools.')
  url.searchParams.set('uniqueId', channelName(channel))
  const isJwt = /^[\w-]+\.[\w-]+\.[\w-]+$/.test(value)
  url.searchParams.set(isJwt ? 'jwtKey' : 'apiKey', value)
  return url
}
