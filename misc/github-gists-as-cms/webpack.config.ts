import 'dotenv/config'
import 'webpack-dev-server'

import ContentRepository from './webpack/content-repository'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'node:path'

import { paths } from './webpack'

import type { Configuration } from 'webpack'

const getConfig = async () => {
  const contentRepository = new ContentRepository(
    process.env.WEBPACK_GIST_ID,
    process.env.WEBPACK_TMP_DIR,
    process.env.WEBPACK_GITHUB_USERNAME,
  )

  const contents = await contentRepository.getAll()

  const config: Configuration = {
    entry: path.join(paths.scripts, 'index.ts'),
    output: {
      filename: 'assets/js/[name].js',
      path: paths.output,
      clean: true,
    },
    module: {
      rules: [{ test: /\.pug$/, loader: 'pug-loader' }],
    },
    plugins: [
      ...contents.map(
        (content) =>
          new HtmlWebpackPlugin({
            template: path.join(paths.views, `${content.type}.pug`),
            filename: `${content.slug}.html`,
            templateParameters: {
              content,
            },
          }),
      ),
      new HtmlWebpackPlugin({
        template: path.join(paths.views, 'articles.pug'),
        filename: 'articles.html',
        templateParameters: {
          articles: contents.filter((content) => content.type == 'article'),
        },
      }),
    ],
    resolve: {
      extensions: ['.js', '.ts'],
    },
    devServer: {
      hot: false,
      static: {
        directory: paths.output,
      },
      historyApiFallback: {
        rewrites: [
          ...contents.map(({ slug }) => ({
            from: new RegExp(`/${slug}$`),
            to: `/${slug}.html`,
          })),
          { from: /\/articles$/, to: '/articles.html' },
        ],
      },
      port: 1234,
    },
  }

  return config
}

export default getConfig()
