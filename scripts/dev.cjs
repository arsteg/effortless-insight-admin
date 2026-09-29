// Next reads NODE_OPTIONS when budgeting its server child process. A flag on
// the launcher alone is overridden by its default (half of physical RAM).
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=2048`.trim()

const next = require.resolve('next/dist/bin/next')
process.argv = [process.execPath, next, 'dev', '--webpack', ...process.argv.slice(2)]
require(next)
