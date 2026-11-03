export type Command =
  | { kind: 'join' }
  | { kind: 'leave' }
  | { kind: 'seat'; seatId: number }
  | { kind: 'react'; reaction: 'heart' | 'cheer' }
  | { kind: 'help' }

export function parseCommand(message: string): Command | null {
  const [token, argument] = message.trim().toLocaleLowerCase('vi').split(/\s+/, 2)
  if (token === '!join') return { kind: 'join' }
  if (token === '!leave') return { kind: 'leave' }
  if (token === '!help') return { kind: 'help' }
  if (token === '!seat' && argument && /^\d{1,2}$/.test(argument)) {
    const seatId = Number(argument)
    return seatId >= 1 && seatId <= 12 ? { kind: 'seat', seatId } : null
  }
  if (token === '!react' && (argument === 'heart' || argument === 'cheer')) {
    return { kind: 'react', reaction: argument }
  }
  return null
}