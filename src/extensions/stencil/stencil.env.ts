/* eslint-disable no-console */
import { Environment } from '../environments';
import { Tester } from '../tester';
import { BuildTask } from '../builder';
import { Compiler, CompilerExtension } from '../compiler';
import { DevServer, DevServerContext } from '../bundler';
import { StencilExtension } from './stencil.extension';
import { WebpackExtension } from '../webpack';
import webpackConfig from './webpack/webpack.config';

/**
 * a component environment built for [React](https://reactjs.org) .
 */
export class StencilEnv implements Environment {
  constructor(
    /**
     * stencil extension.
     */
    private stencil: StencilExtension,

    /**
     * compiler extension.
     */
    private compiler: CompilerExtension,

    /**
     * webpack extension.
     */
    private webpack: WebpackExtension
  ) {}

  private _tsconfig: any;

  setTsConfig(tsconfig: any) {
    this._tsconfig = tsconfig;
    return this;
  }

  /**
   * returns a component tester.
   */
  getTester(): Tester {
    return this.stencil.createTester();
  }

  /**
   * returns a component compiler.
   */
  getCompiler(): Compiler {
    // eslint-disable-next-line global-require
    const tsconfig = this._tsconfig || require('./typescript/tsconfig.json');
    return this.stencil.createCompiler(
      {
        module: 'esnext',
        target: 'es2017',
      },
      {},
      tsconfig
    );
  }

  /**
   * returns and configures the component linter.
   */
  getLinter() {}

  /**
   * returns and configures the React component dev server.
   */
  getDevServer(context: DevServerContext): DevServer {
    return this.webpack.createDevServer(context, webpackConfig());
  }

  /**
   * return a path to a docs template.
   */
  getDocsTemplate() {
    // return require.resolve('./docs');
  }

  /**
   * adds dependencies to all configured components.
   */
  async getDependencies() {
    return {
      dependencies: {
        react: '-',
        '@stencil/core': '-',
      },
      // TODO: add this only if using ts
      devDependencies: {
        '@types/react': '^16.9.17',
        '@stencil/core': '^1.12.2',
        '@stencil/sass': '^1.3.2',
      },
      // TODO: take version from config
      peerDependencies: {
        react: '^16.12.0',
      },
    };
  }

  getPackageJsonProps() {
    return {
      stam: 'ok',
      main: './dist/index.js',
      module: './dist/index.mjs',
      collection: './dist/collection/collection-manifest.json',
      types: './dist/types/components.d.ts',
    };
  }

  /**
   * returns the component build pipeline.
   */
  getPipe(): BuildTask[] {
    // return BuildPipe.from([this.compiler.task, this.tester.task]);
    // return BuildPipe.from([this.tester.task]);
    return [this.compiler.task];
  }
}
