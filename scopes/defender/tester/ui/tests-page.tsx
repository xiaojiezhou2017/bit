import { useQuery, useSubscription, gql } from '@apollo/client';
import { ComponentContext } from '@teambit/component';
import { H1 } from '@teambit/documenter.ui.heading';
import { Separator } from '@teambit/documenter.ui.separator';
import { MdxPage } from '@teambit/ui.mdx-page';
import { wideColumn } from '@teambit/base-ui.layout.page-frame';
import { TestLoader } from '@teambit/ui.test-loader';
import classNames from 'classnames';
import React, { HTMLAttributes, useContext, useEffect } from 'react';
import { TestTable } from '@teambit/ui.test-table';
import { NotificationContext } from '@teambit/ui.notifications.notification-context';

import { AddingTests } from '@teambit/instructions.adding-tests';

import styles from './tests-page.module.scss';

const TESTS_SUBSCRIPTION_CHANGED = gql`
  subscription OnTestsChanged($id: String!) {
    testsChanged(id: $id) {
      testsResults {
        testFiles {
          file
          duration
          pass
          failed
          pending
          error {
            failureMessage
          }
          tests {
            ancestor
            duration
            status
            name
            error
          }
        }
      }
    }
  }
`;

const GET_COMPONENT = gql`
  query($id: String!) {
    getHost {
      id # for GQL caching
      getTests(id: $id) {
        loading
        testsResults {
          testFiles {
            file
            duration
            pass
            failed
            pending
            error {
              failureMessage
            }
            tests {
              ancestor
              duration
              status
              name
              error
            }
          }
        }
      }
    }
  }
`;

type TestsPageProps = {} & HTMLAttributes<HTMLDivElement>;

export function TestsPage({ className }: TestsPageProps) {
  const component = useContext(ComponentContext);
  const onTestsChanged = useSubscription(TESTS_SUBSCRIPTION_CHANGED, { variables: { id: component.id.toString() } });
  const { data } = useQuery(GET_COMPONENT, {
    variables: { id: component.id._legacy.name },
  });

  const testData = onTestsChanged.data?.testsChanged || data?.getHost?.getTests;
  const notifications = useContext(NotificationContext);
  const testResults = testData?.testsResults?.testFiles;

  // add notification for empty state
  useEffect(() => {
    if (testResults !== null && testData?.testsResults !== null) {
      return () => {};
    }

    const message = notifications.log("you've got no tests! let Debbie show you how it's done");
    const timeoutId = setTimeout(() => notifications.dismiss(message), 10 * 1000);

    return () => {
      clearTimeout(timeoutId);
      notifications.dismiss(message);
    };
  }, []);

  // TODO: change loading EmptyBox
  if (testData?.loading) return <TestLoader />;

  if (testResults === null || testData?.testsResults === null) {
    return (
      <div className={classNames(wideColumn, className)}>
        <MdxPage>
          <AddingTests />
        </MdxPage>
      </div>
    );
  }

  return (
    <div className={classNames(styles.testsPage, className)}>
      <div>
        <H1 className={styles.title}>Tests</H1>
        <Separator className={styles.separator} />
        <TestTable testResults={testResults} className={styles.testBlock} />
      </div>
    </div>
  );
}
