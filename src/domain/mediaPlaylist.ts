export function parseMediaPlaylist(value: string): string[] {
  return value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean)
}