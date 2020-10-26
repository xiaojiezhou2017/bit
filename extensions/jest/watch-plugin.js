const { addWatchPlugin } = require('./jest.tester');

let onTestRunCompleteFn;

module.exports = class JestWatchPlugin {
  apply(jestHooks) {
    jestHooks.onTestRunComplete((testSuiteInfo) => {
      if (onTestRunCompleteFn) onTestRunCompleteFn(testSuiteInfo);
    });

    // jestHooks.shouldRunTestSuite(testSuiteInfo => {
    //   // console.log(testSuiteInfo);
    // });

    // jestHooks.onFileChange(({projects}) => {
    //   // console.log(projects);
    // });
  }
};

function onTestRunComplete(fn) {
  onTestRunCompleteFn = fn;
}

addWatchPlugin({
  onTestRunComplete,
});
