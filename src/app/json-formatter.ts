import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonNodeComponent, JsonValue, TreeViewMode } from './json-node';

const EXAMPLE_VALUE: JsonValue = {
  request: {
    id: '2gis-demo-2048',
    query: 'кофейни рядом',
    location: {
      city: 'Новосибирск',
      coordinates: [55.0084, 82.9357],
    },
  },
  results: [
    {
      name: 'Точка притяжения',
      rating: 4.8,
      openNow: true,
      categories: ['кофейня', 'завтраки'],
    },
    {
      name: 'Академия кофе',
      rating: 4.6,
      openNow: false,
      categories: ['кофейня'],
    },
  ],
  meta: {
    total: 2,
    cached: false,
    nextPage: null,
  },
};

const EXAMPLE_JSON = JSON.stringify(EXAMPLE_VALUE, null, 2);

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [FormsModule, JsonNodeComponent],
  templateUrl: './json-formatter.html',
  styleUrl: './json-formatter.scss',
})
export class JsonFormatterComponent {
  protected readonly rawJson = signal(EXAMPLE_JSON);
  protected readonly parsedJson = signal<JsonValue | undefined>(EXAMPLE_VALUE);
  protected readonly parseError = signal<string | null>(null);
  protected readonly viewMode = signal<TreeViewMode>('expanded');
  protected readonly viewVersion = signal(0);
  protected readonly copied = signal(false);
  protected readonly isDirty = signal(false);

  protected readonly lineCount = computed(() => this.rawJson().split('\n').length);
  protected readonly lineNumbers = computed(() =>
    Array.from({ length: this.lineCount() }, (_, index) => index + 1),
  );
  protected readonly characterCount = computed(() => this.rawJson().length);
  protected readonly formattedJson = computed(() => {
    const value = this.parsedJson();
    return value === undefined ? '' : JSON.stringify(value, null, 2);
  });
  protected readonly formattedLineCount = computed(() =>
    this.formattedJson() ? this.formattedJson().split('\n').length : 0,
  );
  protected readonly nodeCount = computed(() => {
    const value = this.parsedJson();
    return value === undefined ? 0 : this.countNodes(value);
  });
  protected readonly statusLabel = computed(() => {
    if (this.parseError()) {
      return 'Невалидный JSON';
    }

    return this.isDirty() ? 'Есть изменения' : 'Валидный JSON';
  });

  protected onEditorInput(value: string): void {
    this.rawJson.set(value);
    this.isDirty.set(true);
    this.parseError.set(null);
    this.copied.set(false);
  }

  protected formatJson(): void {
    const source = this.rawJson().trim();

    if (!source) {
      this.parsedJson.set(undefined);
      this.parseError.set('Вставьте JSON в поле слева, чтобы начать форматирование.');
      this.isDirty.set(false);
      return;
    }

    try {
      const value = JSON.parse(source) as JsonValue;
      this.parsedJson.set(value);
      this.rawJson.set(JSON.stringify(value, null, 2));
      this.parseError.set(null);
      this.isDirty.set(false);
      this.setViewMode('expanded');
      this.copied.set(false);
    } catch (error) {
      this.parsedJson.set(undefined);
      this.parseError.set(this.getParseError(error, source));
      this.isDirty.set(false);
    }
  }

  protected clearEditor(): void {
    this.rawJson.set('');
    this.parsedJson.set(undefined);
    this.parseError.set(null);
    this.isDirty.set(false);
    this.copied.set(false);
  }

  protected loadExample(): void {
    this.rawJson.set(EXAMPLE_JSON);
    this.parsedJson.set(EXAMPLE_VALUE);
    this.parseError.set(null);
    this.isDirty.set(false);
    this.setViewMode('expanded');
  }

  protected setViewMode(mode: TreeViewMode): void {
    this.viewMode.set(mode);
    this.viewVersion.update((version) => version + 1);
  }

  protected dismissError(): void {
    this.parseError.set(null);
  }

  protected async copyFormattedJson(): Promise<void> {
    const value = this.formattedJson();

    if (!value || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      this.copied.set(false);
    }
  }

  private countNodes(value: JsonValue): number {
    if (Array.isArray(value)) {
      let total = 1;

      for (const item of value as JsonValue[]) {
        total += this.countNodes(item);
      }

      return total;
    }

    if (value !== null && typeof value === 'object') {
      let total = 1;

      for (const item of Object.values(value) as JsonValue[]) {
        total += this.countNodes(item);
      }

      return total;
    }

    return 1;
  }

  private getParseError(error: unknown, source: string): string {
    const message = error instanceof Error ? error.message : '';
    const positionMatch = message.match(/position\s+(\d+)/i);

    if (!positionMatch) {
      return 'Некорректный JSON. Проверьте скобки, кавычки и запятые.';
    }

    const position = Number(positionMatch[1]);
    const beforeError = source.slice(0, position);
    const line = beforeError.split('\n').length;
    const lastLineBreak = beforeError.lastIndexOf('\n');
    const column = position - lastLineBreak;

    return `Некорректный JSON — строка ${line}, столбец ${column}.`;
  }
}
