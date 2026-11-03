const youtubeHosts = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
])

const videoIdPattern = /^[\w-]{11}$/

export function youtubeEmbedUrl(input: string): string | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)
    || !youtubeHosts.has(url.hostname)
    || url.username
    || url.password
    || url.port) {
    return null
  }

  const segments = url.pathname.split('/').filter(Boolean)
  const videoId = url.hostname === 'youtu.be'
    ? segments[0]
    : segments[0] === 'watch'
      ? url.searchParams.get('v') ?? undefined
      : ['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')
        ? segments[1]
        : undefined

  if (!videoId || !videoIdPattern.test(videoId)) return null
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
}