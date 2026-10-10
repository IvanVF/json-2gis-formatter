import { Component } from '@angular/core';
import { JsonFormatterComponent } from './components/json-formatter';

@Component({
  selector: 'app-root',
  imports: [JsonFormatterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
