import { TranspileOptions } from '@stencil/core/compiler';
import { Config } from '@stencil/core';
import { StencilCompiler } from './stencil.compiler';
import { Environments } from '../environments';
import { StencilEnv } from './stencil.env';
import { CompilerExtension, Compiler } from '../compiler';
import { StencilTester } from './stencil.tester';
import { WorkspaceExt, Workspace } from '../workspace';
// import { StencilDevServer } from './stencil.dev-server';
import { WebpackExtension } from '../webpack';
import { TypeScriptCompilerOptions } from '../typescript/compiler-options';

export class StencilExtension {
  static id = '@teambit/stencil';

  constructor(
    /**
     * workspace extension.
     */
    private workspace: Workspace
  ) {}

  /**
   *  return extiontion icon
   */
  // need to upload stencil icon
  // icon() {
  //   return 'https://static.bit.dev/extensions-icons/stencil.svg';
  // }

  createCompiler(
    options: TranspileOptions,
    stencilConfigOptions: Config,
    tsConfigOptions: TypeScriptCompilerOptions
  ): Compiler {
    return new StencilCompiler(options, stencilConfigOptions, tsConfigOptions);
  }

  createTester() {
    return new StencilTester(this.workspace);
  }

  createDevServer() {
    // return new StencilDevServer({}, this.workspace);
  }

  static dependencies = [Environments, CompilerExtension, WorkspaceExt, WebpackExtension];

  static async provider([envs, compiler, workspace, webpack]: [
    Environments,
    CompilerExtension,
    Workspace,
    WebpackExtension
  ]) {
    const stencil = new StencilExtension(workspace);
    envs.registerEnv(new StencilEnv(stencil, compiler, webpack));

    return stencil;
  }
}
