import { readdir } from 'node:fs/promises'

const root = `${import.meta.dirname}/steps`

const listed = async dir => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  const files = await Promise.all(entries.filter(entry => entry.isFile() && !entry.name.startsWith('.')).map(async entry => {
    const path = `${entry.parentPath}/${entry.name}`
    return [path.slice(dir.length + 1), await Bun.file(path).text()]
  }))
  return Object.fromEntries(files)
}

const touched = (before, after) => path => {
  if (!(path in before)) return 'added'
  if (!(path in after)) return 'removed'
  return before[path] === after[path] ? '' : 'modified'
}

// Step names for the bar, in step order
const titles = ['index.html', 'Adding styles', 'Steady scrollbar', 'Separate CSS file', 'Stylecheat']

// Each step is the plain-HTML folder steps/<n>/, served at /<n>/; step 1 lives at the address /, the rest at /<n>
export const steps = async () => {
  const folders = (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort((a, b) => a - b)
  const snapshots = await Promise.all(folders.map(async name => ({ name, files: await listed(`${root}/${name}`) })))

  return snapshots.map(({ name, files }, at) => {
    const before = snapshots[at - 1]?.files ?? {}
    const state = touched(before, files)
    return {
      route: at ? `/${name}` : '/',
      src: `/${name}/index.html`,
      title: titles[at],
      files: [...new Set([...Object.keys(before), ...Object.keys(files)])].sort().map(path => ({
        path,
        before: before[path] ?? '',
        after: files[path] ?? '',
        state: state(path),
      })),
    }
  })
}

if (import.meta.main) {
  const compiled = `${import.meta.dirname}/compiled`
  await Bun.write(`${compiled}/steps.json`, JSON.stringify(await steps()))
  // The steps are plain HTML that Vibe's compiler skips, so they're copied as they are
  for (const path of new Bun.Glob('**/*').scanSync({ cwd: root, dot: false })) await Bun.write(`${compiled}/${path}`, Bun.file(`${root}/${path}`))
}
