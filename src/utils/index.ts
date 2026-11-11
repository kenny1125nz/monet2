const enabled =
  process.env.MONET_DEBUG === '1' ||
  (typeof process.env.DEBUG === 'string' && process.env.DEBUG.includes('monet'))

function write(level: string, msg: string, meta?: unknown): void {
  const line = meta !== undefined
    ? `[monet:${level}] ${msg} ${JSON.stringify(meta)}`
    : `[monet:${level}] ${msg}`
  process.stderr.write(line + '\n')
}

export const log = {
  debug(msg: string, meta?: unknown): void {
    if (enabled) write('debug', msg, meta)
  },
  info(msg: string, meta?: unknown): void {
    write('info', msg, meta)
  },
  error(msg: string, meta?: unknown): void {
    write('error', msg, meta)
  },
}
