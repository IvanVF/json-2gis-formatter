import { Routes } from '@angular/router';
import { DgisViewerComponent } from './components/dgis-viewer';
import { JsonFormatterComponent } from './components/json-formatter';

export const routes: Routes = [
  {
    path: '',
    component: JsonFormatterComponent,
    title: 'JSON Formatter',
  },
  {
    path: 'viewer',
    component: DgisViewerComponent,
    title: '2ГИС Viewer',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
