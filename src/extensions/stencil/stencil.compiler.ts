import path from 'path';
import fs from 'fs-extra';
import merge from 'lodash.merge';
import { createNodeLogger, createNodeSys } from '@stencil/core/sys/node';
import { transpileSync, TranspileOptions, createCompiler, loadConfig } from '@stencil/core/compiler';
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { Compiler } from '../compiler';
import { BuildContext, BuildResults } from '../builder';
import { TranspileOutput, TranspileOpts } from '../compiler/types';
import { TypeScriptCompilerOptions } from '../typescript/compiler-options';
import { getStencilConfigFile } from './stencil.config';

export class StencilCompiler implements Compiler {
  constructor(
    private transpileOpts: TranspileOptions,
    private stencilConfigOptions: Config,
    private tsConfigOptions: TypeScriptCompilerOptions
  ) {}

  transpileFile(fileContent: string, options: TranspileOpts): TranspileOutput {
    const output = transpileSync(fileContent, this.transpileOpts);
    const _path = options.filePath.split('.');
    _path[_path.length - 1] = 'js';

    return [
      {
        outputText: output.code,
        outputPath: path.join('.'),
      },
    ];
  }

  getDistDir(): string {
    return 'dist';
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDistPathBySrcPath(srcPath: string): string {
    return path.join(this.getDistDir());
  }

  isFileSupported(filePath: string): boolean {
    return (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) && !filePath.endsWith('.d.ts');
  }

  async build(context: BuildContext): Promise<BuildResults> {
    const capsules = context.capsuleGraph.capsules;
    const capsuleDirs = capsules.getAllCapsuleDirs();

    // @ts-ignore need to update TypeScriptCompilerOptions
    this.tsConfigOptions.include = context.components[0].filesystem.files.map((f) => {
      return f.path;
    });

    await this.writeTsConfig(capsuleDirs);
    await this.writeStencilConfig(capsuleDirs);

    const nodeLogger = createNodeLogger({ process });
    const nodeSys = createNodeSys({ process });
    let stencilConfig: Config = {
      /* user config */
      namespace: context.components[0].displayName,
      tsconfig: `${capsuleDirs[0]}/tsconfig.json`,
      plugins: [sass()],
    };
    stencilConfig = merge(stencilConfig, this.stencilConfigOptions);
    const validated = await loadConfig({
      logger: nodeLogger,
      sys: nodeSys,
      config: stencilConfig,
      configPath: `${capsuleDirs[0]}/stencil.config.ts`,
    });
    const compiler = await createCompiler(validated.config);
    await compiler.build();

    const components = capsules.map((capsule) => {
      const id = capsule.id;
      const errors = [];
      return { id, errors };
    });

    return { artifacts: [{ dirName: this.getDistDir() }], components };
  }

  private async writeTsConfig(dirs: string[]) {
    const tsconfigStr = JSON.stringify(this.tsConfigOptions, undefined, 2);
    await Promise.all(dirs.map((capsuleDir) => fs.writeFile(path.join(capsuleDir, 'tsconfig.json'), tsconfigStr)));
  }

  private async writeStencilConfig(dirs: string[]) {
    await Promise.all(
      dirs.map((capsuleDir) => fs.writeFile(path.join(capsuleDir, 'stencil.config.ts'), getStencilConfigFile()))
    );
  }
}
