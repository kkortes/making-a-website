import { readdir } from 'node:fs/promises'
import { diff } from '@ape-egg/codie/diff'
import { CLASS } from '@ape-egg/codie/constants'

const root = `${import.meta.dirname}/steps`

const listed = async dir => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  const files = await Promise.all(entries.filter(entry => entry.isFile() && !entry.name.startsWith('.')).map(async entry => {
    const path = `${entry.parentPath}/${entry.name}`
    return [path.slice(dir.length + 1), await Bun.file(path).text()]
  }))
  return Object.fromEntries(files)
}

// A step Vibe compiles as an SPA ("spa": true) keeps every page in pages/, its home page too
const spa = files => !!JSON.parse(files['package.json'] ?? '{}')['vibe-compiler']?.spa
const home = files => spa(files) ? 'pages/index.html' : 'index.html'

// A step links its stylesheets from its own root (/style.css); one its folder doesn't have is the site's (/stylecheat.css), and one of its files too
const linked = async files => {
  const paths = [...files[home(files)].matchAll(/<link rel="stylesheet" href="\/([^"]+)">/g)].map(match => match[1]).filter(path => !(path in files))
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, await Bun.file(`${import.meta.dirname}/${path}`).text()])))
}

const snapshot = async name => {
  const files = await listed(`${root}/${name}`)
  const site = await linked(files)
  return { name, files: { ...files, ...site }, site: Object.keys(site) }
}

// Stylesheets come last; before them the step's page leads its root files, the rest follow by path, and nested files come after
const byPage = (a, b) => a.endsWith('.css') - b.endsWith('.css') || a.includes('/') - b.includes('/') || (b === 'index.html') - (a === 'index.html') || a.localeCompare(b)

// A changed file's added and removed lines, counted from the rows Codie's diff draws, so a big diff's size is known without drawing it
const lines = (before, after) => {
  const rows = diff(before, after)
  return { added: rows.split(CLASS.DIFF_ADDED).length - 1, removed: rows.split(CLASS.DIFF_REMOVED).length - 1 }
}

const touched = (before, after) => path => {
  if (!(path in before)) return 'added'
  if (!(path in after)) return 'removed'
  return before[path] === after[path] ? '' : 'modified'
}

// Step names for the bar, in step order
const titles = ['index.html', 'Adding styles', 'Separate CSS file', 'Vibe', 'Compiled', 'Stylecheat', 'MPA', 'SPA', 'Reactivity']

// Each step is the folder steps/<n>/, served at /<n>/; step 1 lives at the address /, the rest at /<n>
export const steps = async () => {
  const folders = (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort((a, b) => a - b)
  const snapshots = await Promise.all(folders.map(snapshot))

  return snapshots.map(({ name, files, site }, at) => {
    const previous = snapshots[at - 1]?.files ?? {}
    // A home page that moved (index.html into pages/ for an SPA) diffs against the previous step's
    const moved = home(previous) !== home(files)
    const before = Object.fromEntries(Object.entries(previous).map(([path, text]) => [moved && path === home(previous) ? home(files) : path, text]))
    const state = path => moved && path === home(files) ? 'moved' : touched(before, files)(path)
    const route = at ? `/${name}` : '/'
    // Each page has its own address: the home page the step's, pages/<page>.html /<n>/<page>.html, or /<n>/<page> in an SPA;
    // the step links to a page by its path from the step's root (/pages/about-me.html), or in an SPA by the route Vibe names after it (/about-me)
    const named = path => path.slice('pages/'.length).replace(/\.html$/, spa(files) ? '' : '.html')
    const paths = Object.keys(files).filter(path => path === home(files) || /^pages\/[^/]+\.html$/.test(path))
    const pages = Object.fromEntries(paths.map(path => [path, path === home(files) ? route : `${route.replace(/\/$/, '')}/${named(path)}`]))
    const link = path => spa(files) ? `/${path === home(files) ? '' : named(path)}` : `/${path}`
    return {
      route,
      src: `/${name}/${home(files)}`,
      title: titles[at],
      spa: spa(files),
      site,
      pages,
      links: Object.fromEntries(paths.map(path => [link(path), pages[path]])),
      // A step whose package.json has dependencies shows node_modules/ in the file tree, a placeholder with no files and no diff
      installed: !!JSON.parse(files['package.json'] ?? '{}').dependencies,
      files: [...new Set([...Object.keys(before), ...Object.keys(files)])].sort(byPage).map(path => ({
        path,
        folder: path.slice(0, path.lastIndexOf('/') + 1),
        before: before[path] ?? '',
        after: files[path] ?? '',
        state: state(path),
        lines: state(path) ? lines(before[path] ?? '', files[path] ?? '') : { added: 0, removed: 0 },
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
