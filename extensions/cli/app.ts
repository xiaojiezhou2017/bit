// refactor to extension env.
const hook = require('css-modules-require-hook');
const scss = require('node-sass');

hook({
  generateScopedName: '[name]__[local]___[hash:base64:5]',
  extensions: ['.scss'],
  preprocessCss: (css, filename) => {
    return scss.renderSync({
      data: css,
      file: filename,
    }).css;
  },
});

import harmony from '@teambit/harmony';
import { handleErrorAndExit } from 'bit-bin/dist/cli/command-runner';
import { ConfigExt } from '@teambit/config';
import { BitExt, registerCoreExtensions } from '@teambit/bit';
import { CLIExtension } from './cli.extension';
import { bootstrap } from 'bit-bin/dist/bootstrap';

initApp();

async function initApp() {
  try {
    await bootstrap();
    registerCoreExtensions();
    await harmony.run(ConfigExt);
    await harmony.set([BitExt]);
    await runCLI();
  } catch (err) {
    const originalError = err.originalError || err;
    handleErrorAndExit(originalError, process.argv[2]);
  }
}

async function runCLI() {
  const cli: CLIExtension = harmony.get('CLIExtension');
  if (!cli) throw new Error(`failed to get CLIExtension from Harmony`);
  await cli.run();
}
