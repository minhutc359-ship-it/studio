import { describe, expect, it } from 'vitest'
import { parseMediaPlaylist } from './mediaPlaylist'

describe('parseMediaPlaylist', () => {
  it('parses one URL per line and skips empty lines', () => {
    expect(parseMediaPlaylist(' https://example.com/one.mp4\n\n https://youtu.be/abcdefghijk \r\n'))
      .toEqual(['https://example.com/one.mp4', 'https://youtu.be/abcdefghijk'])
  })

  it('keeps a legacy single URL as one playlist item', () => {
    expect(parseMediaPlaylist('https://example.com/video.m3u8'))
      .toEqual(['https://example.com/video.m3u8'])
  })
})