import { defineConfig } from 'cypress';
import { mergeZephyrReports, cleanZephyrReports } from '@hmcts/zephyr-automation-nodejs';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import {
  addCucumberPreprocessorPlugin,
  afterRunHandler,
  afterScreenshotHandler,
  afterSpecHandler,
  beforeRunHandler,
} from '@badeball/cypress-cucumber-preprocessor';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpackPreprocessor = require('@cypress/webpack-preprocessor');

interface IAngularWorkspaceProjectBuildOptions {
  tsConfig?: string;
  assets?: unknown[];
  styles?: string[];
  stylePreprocessorOptions?: {
    includePaths?: string[];
  };
  scripts?: string[];
  allowedCommonJsDependencies?: string[];
  inlineStyleLanguage?: string;
  [key: string]: unknown;
}

interface IAngularWorkspaceProject {
  root?: string;
  sourceRoot: string;
  architect: {
    build: {
      options: IAngularWorkspaceProjectBuildOptions;
      configurations?: {
        development?: Record<string, unknown>;
      };
    };
  };
}

interface IAngularWorkspaceConfig {
  projects: Record<string, IAngularWorkspaceProject>;
}

const e2eTsconfigPath = path.resolve(__dirname, 'e2e.tsconfig.json');
const componentTsconfigPath = path.resolve(__dirname, 'cypress/tsconfig.json');
const componentStylesPath = path.resolve(__dirname, 'cypress/support/component-styles.scss');
const angularWorkspace = JSON.parse(
  readFileSync(path.resolve(__dirname, 'angular.json'), 'utf8'),
) as IAngularWorkspaceConfig;
const angularProject = angularWorkspace.projects['opal-rm-frontend'];
const resolveBrowserToRun = (): string => (process.env.BROWSER_TO_RUN || 'edge').trim().toLowerCase();
const resolvedBrowserToRun = resolveBrowserToRun();

const componentProjectConfig = {
  root: angularProject.root || '.',
  sourceRoot: angularProject.sourceRoot,
  buildOptions: {
    ...angularProject.architect.build.options,
    ...(angularProject.architect.build.configurations?.development || {}),
    styles: [path.relative(__dirname, componentStylesPath)],
  },
};

function setupBrowserLaunch(on: Cypress.PluginEvents): void {
  on('before:browser:launch', (browser: Cypress.Browser, launchOptions: Cypress.BeforeBrowserLaunchOptions) => {
    const width = 3640;
    const height = 2560;

    if (browser.name === 'chrome' && browser.isHeadless) {
      launchOptions.args = [
        ...(launchOptions.args ?? []),
        `--window-size=${width},${height}`,
        '--force-device-scale-factor=1',
      ];
    }

    if (browser.name === 'electron' && browser.isHeadless) {
      launchOptions.preferences = {
        ...launchOptions.preferences,
        width,
        height,
      } as typeof launchOptions.preferences;
    }

    if (browser.name === 'firefox' && browser.isHeadless) {
      launchOptions.args = [...(launchOptions.args ?? []), `--width=${width}`, `--height=${height}`];
    }

    return launchOptions;
  });
}

async function setupE2eNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Promise<Cypress.PluginConfigOptions> {
  await addCucumberPreprocessorPlugin(on, config, {
    omitAfterScreenshotHandler: true,
    omitAfterSpecHandler: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin');
  cypressGrepPlugin(config);

  on(
    'file:preprocessor',
    webpackPreprocessor({
      webpackOptions: {
        devtool: 'eval',
        resolve: {
          extensions: ['.ts', '.js'],
          plugins: [
            new TsconfigPathsPlugin({
              configFile: e2eTsconfigPath,
            }),
          ],
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              exclude: [/node_modules/, /src/],
              use: [
                {
                  loader: 'ts-loader',
                  options: {
                    context: __dirname,
                    configFile: e2eTsconfigPath,
                    transpileOnly: true,
                    compilerOptions: {
                      sourceMap: false,
                      inlineSourceMap: false,
                      inlineSources: false,
                    },
                  },
                },
              ],
            },
            {
              test: /\.feature$/,
              include: [/cypress\/e2e/],
              use: [
                {
                  loader: '@badeball/cypress-cucumber-preprocessor/webpack',
                  options: config,
                },
              ],
            },
          ],
        },
      },
    }),
  );

  setupBrowserLaunch(on);

  on('before:run', async () => {
    await beforeRunHandler(config);
  });

  on('after:run', async (results) => {
    await afterRunHandler(config, results);
  });

  on('after:spec', async (spec, results) => {
    await afterSpecHandler(config, spec, results);
  });

  on('after:screenshot', async (details) => {
    if (!details?.testFailure) {
      return details;
    }

    return afterScreenshotHandler(config, details);
  });

  if (process.env.TEST_MODE === 'OPAL') {
    const baseOutputDir = `${process.env.TEST_STAGE}-output/prod/${resolveBrowserToRun()}`;
    config.env.messagesOutput = `${baseOutputDir}/cucumber/${process.env.TEST_MODE}-report-${process.env.CYPRESS_THREAD}.ndjson`;
  } else if (process.env.TEST_MODE === 'LEGACY') {
    config.env.messagesOutput =
      `${process.env.TEST_STAGE}-output/prod/${resolveBrowserToRun()}/legacy/cucumber/` +
      `${process.env.TEST_MODE}-report-${process.env.CYPRESS_THREAD}.ndjson`;
  }

  return config;
}

export default defineConfig({
  viewportWidth: 2560,
  viewportHeight: 2560,
  reporter: 'junit',
  screenshotsFolder: `functional-output/screenshots/${resolvedBrowserToRun}`,
  experimentalModifyObstructiveThirdPartyCode: true,
  chromeWebSecurity: false,

  env: {
    CYPRESS_TEST_EMAIL: process.env.OPAL_TEST_USER_EMAIL,
    CYPRESS_TEST_PASSWORD: process.env.OPAL_TEST_USER_PASSWORD,
    TEST_MODE: process.env.TEST_MODE || 'OPAL',
    TAGS: process.env.TAGS || '',
    omitFiltered: true,
    filterSpecs: true,
  },

  e2e: {
    baseUrl: process.env.TEST_URL || 'http://localhost:5000',
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.ts',
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents: setupE2eNodeEvents,
  },

  component: {
    specPattern: 'cypress/component/**/*.cy.ts',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled:
        'cypress-mochawesome-reporter, mocha-junit-reporter, @hmcts/zephyr-automation-nodejs/cypress/ZephyrReporter',
      mochaJunitReporterReporterOptions: {
        mochaFile: `functional-output/component/${resolvedBrowserToRun}/junit/component-test-output-[hash].xml`,
        toConsole: false,
      },
      cypressMochawesomeReporterReporterOptions: {
        reportDir: `functional-output/component/${resolvedBrowserToRun}/json`,
        overwrite: false,
        html: false,
        json: true,
      },
    },
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
      options: {
        projectConfig: componentProjectConfig,
      },
      webpackConfig: {
        devServer: {
          port: Number(`809${process.env.CYPRESS_THREAD || '0'}`),
        },
        resolve: {
          extensions: ['.ts', '.js'],
          plugins: [
            new TsconfigPathsPlugin({
              configFile: componentTsconfigPath,
            }),
          ],
        },
      },
    },
    setupNodeEvents(on, config) {
      setupBrowserLaunch(on);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin');
      cypressGrepPlugin(config);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('cypress-mochawesome-reporter/plugin')(on);

      on('before:run', () => {
        cleanZephyrReports({
          rootDir: 'functional-output',
        });
      });

      on('after:run', () => {
        mergeZephyrReports({
          rootDir: 'functional-output',
          dedupe: true,
        });
      });

      return config;
    },
  },
});
