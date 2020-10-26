import { CLIAspect, CLIMain, MainRuntime } from '@teambit/cli';
import { Component } from '@teambit/component';
import { EnvsAspect, EnvsMain } from '@teambit/environments';
import { LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { GraphqlAspect, GraphqlMain } from '@teambit/graphql';
import { merge } from 'lodash';
import UIAspect, { UiMain } from '@teambit/ui';

import { TestsResult } from './tests-results';
import { TestCmd } from './test.cmd';
import { TesterAspect } from './tester.aspect';
import { TesterService } from './tester.service';
import { TesterTask } from './tester.task';
import { testerSchema } from './tester.graphql';

export const OnTestsChanged = 'OnTestsChanged';

export type TesterExtensionConfig = {
  /**
   * regex of the text environment.
   */
  testRegex: string;

  /**
   * determine whether to watch on start.
   */
  watchOnStart: boolean;
};

export type TesterOptions = {
  /**
   * start the tester in watch mode.
   */
  watch: boolean;

  /**
   * start the tester in debug mode.
   */
  debug: boolean;

  /**
   * initiate the tester on given env.
   */
  env?: string;

  /**
   * decide whether test output should be silenced.
   */
  quiet?: boolean;
};

export class TesterMain {
  static runtime = MainRuntime;
  static dependencies = [CLIAspect, EnvsAspect, WorkspaceAspect, LoggerAspect, GraphqlAspect, UIAspect];

  constructor(
    /**
     * envs extension.
     */
    private envs: EnvsMain,

    /**
     * workspace extension.
     */
    private workspace: Workspace,

    /**
     * tester service.
     */
    readonly service: TesterService,

    /**
     * build task.
     */
    readonly task: TesterTask
  ) {}

  async test(components: Component[], opts?: TesterOptions) {
    const options = this.getOptions(opts);
    const envsRuntime = await this.envs.createEnvironment(components);
    if (opts?.env) {
      return envsRuntime.runEnv(opts.env, this.service, options);
    }
    const results = await envsRuntime.run(this.service, options);
    return results;
  }

  getTestsResults(component: Component): TestsResult | undefined {
    const entry = component.state.aspects.get(TesterAspect.id);
    // TODO: type is ok, talk to @david about it
    // @ts-ignore
    return entry?.data.tests;
  }

  private getOptions(options?: TesterOptions): TesterOptions {
    const defaults = {
      watch: false,
      debug: false,
      quiet: false,
    };

    return merge(defaults, options);
  }

  static defaultConfig = {
    /**
     * default test regex for which files tester to apply on.
     */
    testRegex: '*.{spec,test}.{js,jsx,ts,tsx}',

    watchOnStart: true,
  };

  static async provider(
    [cli, envs, workspace, loggerAspect, graphql, ui]: [CLIMain, EnvsMain, Workspace, LoggerMain, GraphqlMain, UiMain],
    config: TesterExtensionConfig
  ) {
    const logger = loggerAspect.createLogger(TesterAspect.id);

    const testerService = new TesterService(workspace, config.testRegex, logger, graphql.pubsub);
    envs.registerService(testerService);

    const tester = new TesterMain(envs, workspace, testerService, new TesterTask(TesterAspect.id));

    if (workspace && !workspace.consumer.isLegacy) {
      cli.unregister('test');
      cli.register(new TestCmd(tester, workspace, logger));
      ui.registerOnStart(async ({ pattern }) => {
        if (!config.watchOnStart) return;
        const components = await workspace.byPattern(pattern);
        await tester.test(components, { watch: true, debug: true, quiet: true });
      });
    }
    graphql.register(testerSchema(tester, graphql));

    return tester;
  }
}

TesterAspect.addRuntime(TesterMain);
