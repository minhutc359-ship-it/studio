import { describe, expect, it } from 'vitest'
import { youtubeEmbedUrl } from './youtube'

describe('youtubeEmbedUrl', () => {
  it('converts standard watch and short links', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=abcdefghijk&t=30'))
      .toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0')
    expect(youtubeEmbedUrl('https://youtu.be/abcdefghijk?si=share'))
      .toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0')
  })

  it('supports Shorts, LIVE, and existing embed URLs', () => {
    expect(youtubeEmbedUrl('https://youtube.com/shorts/abcdefghijk'))
      .toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0')
    expect(youtubeEmbedUrl('https://youtube.com/live/abcdefghijk'))
      .toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0')
    expect(youtubeEmbedUrl('https://youtube.com/embed/abcdefghijk'))
      .toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0')
  })

  it('rejects non-YouTube hosts and malformed links', () => {
    expect(youtubeEmbedUrl('https://youtube.com.example/watch?v=abcdefghijk')).toBeNull()
    expect(youtubeEmbedUrl('https://youtube.com/watch?v=too-short')).toBeNull()
    expect(youtubeEmbedUrl('javascript:alert(1)')).toBeNull()
  })
})