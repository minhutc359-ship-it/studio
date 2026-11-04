export type Reaction = 'heart' | 'cheer' | 'wave' | 'oxygen' | 'wink' | 'cat-laugh' | 'cat-sideeye' | 'cat-cry'

export type Command =
  | { kind: 'join' }
  | { kind: 'leave' }
  | { kind: 'seat'; seatId: number }
  | { kind: 'react'; reaction: Reaction; seatId?: number }
  | { kind: 'help' }

const isReaction = (value: string | undefined): value is Reaction =>
  value !== undefined && ['heart', 'cheer', 'wave', 'oxygen', 'wink', 'cat-laugh', 'cat-sideeye', 'cat-cry'].includes(value)

export function parseCommand(message: string): Command | null {
  const [rawToken, argument, target, extra] = message.trim().toLocaleLowerCase('vi').split(/\s+/)
  const token = rawToken?.replace(/^!/, '')
  if (token === 'join' && !argument) return { kind: 'join' }
  if (token === 'leave' && !argument) return { kind: 'leave' }
  if (token === 'help' && !argument) return { kind: 'help' }
  if (token === 'seat' && argument && !target && /^\d{1,2}$/.test(argument)) {
    const seatId = Number(argument)
    return seatId >= 1 && seatId <= 12 ? { kind: 'seat', seatId } : null
  }
  if (token === 'react' && isReaction(argument) && !extra) {
    if (target === undefined) return { kind: 'react', reaction: argument }
    if (/^(?:[1-9]|1[0-2])$/.test(target)) return { kind: 'react', reaction: argument, seatId: Number(target) }
  }
  return null
}