import harmony from '@teambit/harmony';
import { DocsPreview } from '@teambit/docs';
import { Preview } from './preview.preview';
import { CompositionsPreview } from '@teambit/compositions';
import { GraphQlUI } from '@teambit/graphql';

/**
 * configure all core extensions
 * :TODO pass all other extensions from above.
 */
harmony
  .run([Preview, DocsPreview, CompositionsPreview, GraphQlUI])
  .then(() => {
    const uiExtension = harmony.get<Preview>('@teambit/preview');
    uiExtension.render();
  })
  .catch((err) => {
    throw err;
  });
