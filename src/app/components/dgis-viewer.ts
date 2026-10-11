import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  DgisContactKind,
  DgisOrganizationCard,
  toDgisOrganizationCard,
} from '../models/dgis-response.model';
import { DgisResponseService } from '../services/dgis-response.service';
import { DgisCatalogService } from '../services/dgis-catalog.service';

type ContactFilter =
  | 'all'
  | 'with-website'
  | 'without-website'
  | 'with-phone'
  | 'with-vk'
  | 'with-email';
type DataSource = 'file' | 'api';

@Component({
  selector: 'app-dgis-viewer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dgis-viewer.html',
  styleUrl: './dgis-viewer.scss',
})
export class DgisViewerComponent {
  private readonly responseService = inject(DgisResponseService);
  private readonly catalogService = inject(DgisCatalogService);

  protected readonly cards = signal<DgisOrganizationCard[]>([]);
  protected readonly responseTotal = signal(0);
  protected readonly searchTerm = signal('');
  protected readonly apiQuery = signal('психолог');
  protected readonly source = signal<DataSource>('file');
  protected readonly contactFilter = signal<ContactFilter>('all');
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly withWebsiteCount = computed(
    () => this.cards().filter((card) => Boolean(card.website)).length,
  );
  protected readonly withoutWebsiteCount = computed(
    () => this.cards().length - this.withWebsiteCount(),
  );
  protected readonly withPhoneCount = computed(() => this.countByContactKind('phone'));
  protected readonly withVkCount = computed(() => this.countByContactKind('vk'));
  protected readonly withEmailCount = computed(() => this.countByContactKind('email'));
  protected readonly filteredCards = computed(() => {
    const search = this.searchTerm().trim().toLocaleLowerCase('ru-RU');
    const filter = this.contactFilter();

    return this.cards().filter((card) => {
      const matchesContact = this.matchesContactFilter(card, filter);
      const matchesSearch =
        !search ||
        card.name.toLocaleLowerCase('ru-RU').includes(search) ||
        card.subtitle?.toLocaleLowerCase('ru-RU').includes(search);

      return matchesContact && matchesSearch;
    });
  });

  constructor() {
    afterNextRender(() => void this.loadResponse());
  }

  protected setContactFilter(filter: ContactFilter): void {
    this.contactFilter.set(filter);
  }

  protected async setSource(source: DataSource): Promise<void> {
    if (this.source() === source) {
      return;
    }

    this.source.set(source);
    await this.loadResponse();
  }

  protected setApiQuery(value: string): void {
    this.apiQuery.set(value);
  }

  protected async searchApi(): Promise<void> {
    this.source.set('api');
    await this.loadResponse();
  }

  protected setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected async retry(): Promise<void> {
    await this.loadResponse();
  }

  protected contactIcon(kind: DgisContactKind): string {
    switch (kind) {
      case 'website':
        return '↗';
      case 'phone':
        return '☎';
      case 'email':
        return '@';
      case 'vk':
        return 'vk';
      case 'max':
        return 'M';
      default:
        return '→';
    }
  }

  private async loadResponse(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const query = this.apiQuery().trim() || 'психолог';
      const response =
        this.source() === 'api'
          ? await firstValueFrom(this.catalogService.searchOrganizations(query))
          : await this.responseService.loadResponse();
      this.cards.set(response.result.items.map(toDgisOrganizationCard));
      this.responseTotal.set(response.result.total);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Не удалось загрузить ответ 2ГИС.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private countByContactKind(kind: DgisContactKind): number {
    return this.cards().filter((card) => card.contacts.some((contact) => contact.kind === kind)).length;
  }

  private matchesContactFilter(card: DgisOrganizationCard, filter: ContactFilter): boolean {
    switch (filter) {
      case 'with-website':
        return Boolean(card.website);
      case 'without-website':
        return !card.website;
      case 'with-phone':
        return card.contacts.some((contact) => contact.kind === 'phone');
      case 'with-vk':
        return card.contacts.some((contact) => contact.kind === 'vk');
      case 'with-email':
        return card.contacts.some((contact) => contact.kind === 'email');
      default:
        return true;
    }
  }
}
