export type Reaction = 'heart' | 'cheer' | 'wave'

export type Command =
  | { kind: 'join' }
  | { kind: 'leave' }
  | { kind: 'seat'; seatId: number }
  | { kind: 'react'; reaction: Reaction; seatId?: number }
  | { kind: 'help' }

export function parseCommand(message: string): Command | null {
  const [token, argument, target, extra] = message.trim().toLocaleLowerCase('vi').split(/\s+/)
  if (token === '!join') return { kind: 'join' }
  if (token === '!leave') return { kind: 'leave' }
  if (token === '!help') return { kind: 'help' }
  if (token === '!seat' && argument && /^\d{1,2}$/.test(argument)) {
    const seatId = Number(argument)
    return seatId >= 1 && seatId <= 12 ? { kind: 'seat', seatId } : null
  }
  if (token === '!react' && (argument === 'heart' || argument === 'cheer' || argument === 'wave') && !extra) {
    if (target === undefined) return { kind: 'react', reaction: argument }
    if (/^(?:[1-9]|1[0-2])$/.test(target)) return { kind: 'react', reaction: argument, seatId: Number(target) }
  }
  return null
}