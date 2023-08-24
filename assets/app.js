import 'unpoly'
import Alpine from 'alpinejs'
import mediumZoom from 'medium-zoom'
import docsearch from '@docsearch/js'
import { tabs } from 'edge-uikit/tabs'
import Persist from '@alpinejs/persist'
import collapse from '@alpinejs/collapse'

import {
  initZoomComponent,
  initBaseComponents,
  initSearchComponent,
} from '@dimerapp/docs-theme/scripts'

import.meta.glob(['../content/**/*.png', '../content/**/*.jpeg', '../content/**/*.jpg'])

Alpine.plugin(tabs)
Alpine.plugin(Persist)
Alpine.plugin(collapse)
Alpine.plugin(initBaseComponents)
Alpine.plugin(initSearchComponent(docsearch))
Alpine.plugin(initZoomComponent(mediumZoom))
Alpine.start()
