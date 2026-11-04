export type Reaction = 'heart' | 'cheer' | 'wave' | 'oxygen' | 't1' | 'geng' | 'silent'

export type Command =
  | { kind: 'join' }
  | { kind: 'leave' }
  | { kind: 'seat'; seatId: number }
  | { kind: 'react'; reaction: Reaction; seatId?: number }
  | { kind: 'help' }

const isReaction = (value: string | undefined): value is Reaction | 'clap' | 'oxi' =>
  value !== undefined && ['heart', 'cheer', 'clap', 'wave', 'oxygen', 'oxi', 't1', 'geng', 'silent'].includes(value)

const bareReactionAliases: Record<string, Reaction> = {
  t1: 't1', geng: 'geng', oxi: 'oxygen', silent: 'silent', clap: 'cheer', wave: 'wave',
}

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
    const reaction = argument === 'clap' ? 'cheer' : argument === 'oxi' ? 'oxygen' : argument
    if (target === undefined) return { kind: 'react', reaction }
    if (/^(?:[1-9]|1[0-2])$/.test(target)) return { kind: 'react', reaction, seatId: Number(target) }
  }
  if (!argument && token && bareReactionAliases[token]) {
    return { kind: 'react', reaction: bareReactionAliases[token] }
  }
  return null
}