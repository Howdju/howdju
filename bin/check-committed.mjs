import child_process from 'child_process'
import {promises as fs, constants} from 'fs'
import {basename, dirname, resolve} from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import Debug from 'debug'

const debug = Debug('howdju:check-committed')

const exec = promisify(child_process.exec)

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Throw an error if any workspace deps of the CWD package have uncommitted changes. */
async function ensureCommitted() {
  const depsSet = await getDepsSet()
  const workspaceSubDirs = await getWorkspaceSubDirs(depsSet)
  const codeDirs = workspaceSubDirs.map(d => resolve(__dirname, '..', d))
  // Also check the current directory
  codeDirs.unshift(process.cwd())
  const uncommittedDirs = []
  for (const dir of codeDirs) {
    if (!await isCommitted(dir)) {
      uncommittedDirs.push(dir)
    }
  }
  if (uncommittedDirs.length) {
    throw new Error(`Uncommitted changes in: ${uncommittedDirs.join(", ")}`)
  }
}

async function isCommitted(dir) {
  // Ensure the directory exists, because the git status command will succeed if the path doesn't exist
  await fs.access(dir, constants.F_OK)
  const {stdout} = await exec(`git status -s ${dir}`)
  // If there is output, then there are uncommitted changes
  if (stdout) {
    debug(`Uncomitted changes: \n${stdout}`)
  }
  return !stdout
}

async function getWorkspaceSubDirs(depsSet) {
  /*
  The output of `yarn workspaces list` looks like:
  ```
  ➤ YN0000: .
  ➤ YN0000: lambdas/howdju-message-handler
  ...
  ➤ YN0000: Done in 0s 2ms
  ```
  */
  const {stdout} = await exec('yarn workspaces list')
  const lines = stdout.split('\n')
  // Remove the first and last line, which don't contain workspaces
  lines.shift()
  lines.pop()
  const workspaceDirs = []
  for (const line of lines) {
    const columns = line.split(' ')
    // The third column has the workspace path
    const dir = columns[2]
    const name = basename(dir)
    if (depsSet.has(name)) {
      workspaceDirs.push(dir)
    }
  }
  return workspaceDirs
}

async function getDepsSet() {
  // We expect the command to have been run in the directory containing the package whose deps we are checking.
  const packagePath = resolve(process.cwd(), 'package.json')
  const packageInfo = JSON.parse(await fs.readFile(packagePath))
  const deps = new Set()
  if (packageInfo.dependencies) {
    for (const dep of Object.keys(packageInfo.dependencies)) {
      deps.add(dep)
    }
  }
  if (packageInfo.devDependencies) {
    for (const dep of Object.keys(packageInfo.devDependencies)) {
      deps.add(dep)
    }
  }
  return deps
}

await ensureCommitted()
