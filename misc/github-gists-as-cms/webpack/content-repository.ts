import axios from 'axios'
import path from 'node:path'
import YAML from 'yaml'

import { execSync } from 'node:child_process'

import {
  readdirSync,
  mkdirSync,
  existsSync,
  rmSync,
  readFileSync,
} from 'node:fs'

type Metadata = {
  title: string
  preview: string
}

type ContentType = 'article' | 'default'

export type Content = {
  type: ContentType
  slug: string
  createdAt: string
  plainHtml: string
  cssId: string
  metadata: Metadata
}

class ContentRepository {
  private gistId: string
  private tmpDir: string
  private githubUsername: string

  constructor(gistId: string, tmpDir: string, githubUsername: string) {
    this.gistId = gistId
    this.tmpDir = tmpDir
    this.githubUsername = githubUsername
  }

  private getContentType(fileName: string): ContentType {
    if (fileName.startsWith('a-')) {
      return 'article'
    }

    return 'default'
  }

  private async createTmpDir() {
    const tmpDirPath = path.join(__dirname, '..', this.tmpDir)
    const tmpDirExists = await existsSync(tmpDirPath)

    if (tmpDirExists) {
      await rmSync(tmpDirPath, { force: true, recursive: true })
    }

    await mkdirSync(tmpDirPath)
  }

  private async cloneGitRepository() {
    await execSync(`git clone https://gist.github.com/${this.gistId}.git`, {
      cwd: path.join(__dirname, '..', this.tmpDir),
    })
  }

  private async readAllFiles() {
    return Promise.all(
      await readdirSync(path.join(__dirname, '..', this.tmpDir, this.gistId))
        .filter((fileName) => /.md$/.test(fileName))
        .map(async (fileName) => {
          const data = await readFileSync(
            path.join(__dirname, '..', this.tmpDir, this.gistId, fileName),
          ).toString()

          return {
            fileName,
            data,
          }
        }),
    )
  }

  private async getGistScript(fileName: string) {
    return (
      await axios.get(
        `https://gist.github.com/${this.githubUsername}/${this.gistId}.js?file=${fileName}`,
      )
    ).data
  }

  async getAll(): Promise<Array<Content>> {
    await this.createTmpDir()
    await this.cloneGitRepository()

    const contents = await Promise.all(
      (await this.readAllFiles()).map(async ({ fileName, data }) => {
        const gistScript = await this.getGistScript(fileName)
        const type = this.getContentType(fileName)
        const slug = fileName.replace(/.md/, '')

        const metadataRegex = new RegExp(/<!-- metadata\n([\s\S]+?)\n-->/)
        const rawMetadata = metadataRegex.test(data)
          ? metadataRegex.exec(data)[1]
          : ''
        const metadata = (YAML.parse(rawMetadata) || {}) as Metadata

        const createdAt = await execSync(
          `git log --diff-filter=A --date=raw --follow --format=%aI -- ${fileName} | tail -1`,
          { cwd: path.join(__dirname, '..', this.tmpDir, this.gistId) },
        )
          .toString()
          .trim()

        const rawHtml = /document.write\('(<div id=\\"gist.*)'\)/g.exec(
          gistScript,
        )[1]

        const plainHtml = eval(`'${rawHtml}'`).trim()

        const cssId = /gist-embed-(.*).css/g.exec(gistScript)[1]

        return {
          type,
          slug,
          createdAt,
          plainHtml,
          cssId,
          metadata,
        }
      }),
    )

    return contents
  }
}

export default ContentRepository
