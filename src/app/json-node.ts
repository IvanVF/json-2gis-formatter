import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef,
  signal,
} from '@angular/core';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type TreeViewMode = 'expanded' | 'collapsed';

export interface JsonEntry {
  key: string | number;
  value: JsonValue;
}

@Component({
  selector: 'app-json-node',
  standalone: true,
  imports: [forwardRef(() => JsonNodeComponent)],
  templateUrl: './json-node.html',
  styleUrl: './json-node.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonNodeComponent implements OnChanges {
  @Input() value: JsonValue = null;
  @Input() propertyKey: string | number | null = null;
  @Input() isLast = true;
  @Input() depth = 0;
  @Input() viewMode: TreeViewMode = 'expanded';
  @Input() viewVersion = 0;

  protected readonly collapsed = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewMode'] || changes['viewVersion']) {
      this.collapsed.set(this.viewMode === 'collapsed');
    } else if (changes['value'] && !changes['value'].firstChange) {
      this.collapsed.set(false);
    }
  }

  get isContainer(): boolean {
    return Array.isArray(this.value) || (this.value !== null && typeof this.value === 'object');
  }

  get isArray(): boolean {
    return Array.isArray(this.value);
  }

  get isArrayIndex(): boolean {
    return typeof this.propertyKey === 'number';
  }

  get entries(): JsonEntry[] {
    if (Array.isArray(this.value)) {
      return this.value.map((value, key) => ({ key, value }));
    }

    if (this.value !== null && typeof this.value === 'object') {
      return Object.entries(this.value).map(([key, value]) => ({
        key,
        value: value as JsonValue,
      }));
    }

    return [];
  }

  get childCount(): number {
    return this.entries.length;
  }

  get formattedKey(): string {
    if (this.propertyKey === null) {
      return '';
    }

    return this.isArrayIndex ? `[${this.propertyKey}]` : JSON.stringify(this.propertyKey);
  }

  get formattedPrimitive(): string {
    return JSON.stringify(this.value);
  }

  get valueType(): string {
    if (this.value === null) {
      return 'null-value';
    }

    if (Array.isArray(this.value)) {
      return 'array-value';
    }

    return `${typeof this.value}-value`;
  }

  get openingBracket(): string {
    return this.isArray ? '[' : '{';
  }

  get closingBracket(): string {
    return this.isArray ? ']' : '}';
  }

  get collapsedSummary(): string {
    const noun = this.isArray
      ? this.pluralize(this.childCount, 'элемент', 'элемента', 'элементов')
      : this.pluralize(this.childCount, 'ключ', 'ключа', 'ключей');

    return `${this.childCount} ${noun}`;
  }

  get toggleLabel(): string {
    return this.collapsed()
      ? `Раскрыть ${this.isArray ? 'массив' : 'объект'}`
      : `Скрыть ${this.isArray ? 'массив' : 'объект'}`;
  }

  protected toggle(): void {
    this.collapsed.update((value) => !value);
  }

  private pluralize(count: number, one: string, few: string, many: string): string {
    const remainder10 = count % 10;
    const remainder100 = count % 100;

    if (remainder10 === 1 && remainder100 !== 11) {
      return one;
    }

    if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 10 || remainder100 >= 20)) {
      return few;
    }

    return many;
  }
}
