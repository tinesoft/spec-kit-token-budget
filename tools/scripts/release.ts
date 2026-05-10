import { releaseVersion, releaseChangelog } from 'nx/release'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const dryRun = process.argv.includes('--dry-run')
const firstRelease = process.argv.includes('--first-release')
const verbose = process.argv.includes('--verbose')

;(async () => {
  // 1. Bump version in package.json
  const { workspaceVersion, projectsVersionData, releaseGraph } = await releaseVersion({
    firstRelease,
    dryRun,
    verbose,
  })

  // workspaceVersion is null when there is no bump (e.g. first-release with no new commits)
  const version =
    workspaceVersion ??
    (JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string }).version

  if (!dryRun) {
    // 2. Sync extension.yml version
    const ymlPath = 'extension.yml'
    const updated = readFileSync(ymlPath, 'utf-8')
      .replace(/^  version: .+$/m, `  version: "${version}"`)
    writeFileSync(ymlPath, updated)
    execSync(`git add ${ymlPath}`)
    console.log(`synced extension.yml → ${version}`)
  }

  // 3. Generate changelog, commit, tag, push, create GitHub release
  // The GitHub auto-archive (archive/refs/tags/v*.zip) serves as the install asset.
  // git.commit/tag/push/commitMessage from nx.json changelog.git are respected.
  await releaseChangelog({
    releaseGraph,
    versionData: projectsVersionData,
    version: workspaceVersion,
    firstRelease,
    dryRun,
    verbose,
  })
})()
