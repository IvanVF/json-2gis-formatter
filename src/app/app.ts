import { Component } from '@angular/core';
import { JsonFormatterComponent } from './json-formatter';

@Component({
  selector: 'app-root',
  imports: [JsonFormatterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
