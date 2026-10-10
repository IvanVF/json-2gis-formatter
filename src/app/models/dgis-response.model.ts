export interface DgisResponse {
  meta: DgisMeta;
  result: DgisSearchResult;
}

export interface DgisMeta {
  api_version: string;
  code: number;
  issue_date: string;
}

export interface DgisSearchResult {
  items: DgisOrganization[];
  search_attributes: DgisSearchAttributes;
  total: number;
}

export interface DgisSearchAttributes {
  [key: string]: unknown;
}

export interface DgisOrganization {
  ads?: DgisAds;
  cluster?: Record<string, unknown>;
  context: Record<string, unknown>;
  flags?: DgisFlags;
  floor_id?: string;
  geometry_id: string;
  has_ads_model: boolean;
  id: string;
  is_advertising?: boolean;
  lat: number;
  lon: number;
  match_type: number;
  name: string;
  name_ex?: DgisName;
  reviews?: DgisReviews;
  rubr: string;
  schedule?: DgisSchedule;
  source_type: number;
  timezone_offset: number;
  type: string;
  vital?: number;
}

export interface DgisName {
  extension?: string;
  primary?: string;
  short_name?: string;
}

export interface DgisReviews {
  general_rating?: number;
  general_review_count?: number;
  general_review_count_with_stars?: number;
  is_reviewable?: boolean;
  is_reviewable_on_flamp?: boolean;
  items?: DgisReviewSource[];
  org_rating?: number;
  org_review_count?: number;
  org_review_count_with_stars?: number;
}

export interface DgisReviewSource {
  is_reviewable?: boolean;
  tag?: string;
}

export interface DgisFlags {
  photos?: boolean;
  [key: string]: unknown;
}

export interface DgisAds {
  marker_microcomment?: string;
  options?: DgisAdsOptions;
}

export interface DgisAdsOptions {
  actions?: DgisAction[];
  color?: string;
  marker_logo?: DgisImage;
  organization_stories?: DgisStories;
  [key: string]: unknown;
}

export interface DgisAction {
  caption?: string;
  name?: string;
  platforms?: string[];
  type?: string;
  value?: string;
}

export interface DgisImage {
  url?: string;
  [key: string]: unknown;
}

export interface DgisStories {
  previews?: DgisStoryPreview[];
  [key: string]: unknown;
}

export interface DgisStoryPreview {
  is_prime?: boolean;
  percent?: number;
  preview_image_url?: string;
  story_id?: string;
  title?: string;
}

export interface DgisSchedule {
  Mon?: DgisDaySchedule;
  Tue?: DgisDaySchedule;
  Wed?: DgisDaySchedule;
  Thu?: DgisDaySchedule;
  Fri?: DgisDaySchedule;
  Sat?: DgisDaySchedule;
  Sun?: DgisDaySchedule;
  comment?: string;
}

export interface DgisDaySchedule {
  working_hours?: DgisWorkingHours[];
  [key: string]: unknown;
}

export interface DgisWorkingHours {
  from?: string;
  to?: string;
}

/** Fields prepared for a compact organization card in the viewer. */
export interface DgisOrganizationCard {
  id: string;
  name: string;
  subtitle?: string;
  rating?: number;
  reviewCount: number;
  contacts: DgisContact[];
  website?: string;
  schedule?: string;
  latitude: number;
  longitude: number;
  isAdvertising: boolean;
}

export type DgisContactKind = 'website' | 'phone' | 'email' | 'vk' | 'max' | 'other';

export interface DgisContact {
  kind: DgisContactKind;
  label: string;
  value: string;
  displayValue: string;
  href: string;
}

export function toDgisOrganizationCard(organization: DgisOrganization): DgisOrganizationCard {
  const rating = organization.reviews?.org_rating ?? organization.reviews?.general_rating;
  const reviewCount =
    organization.reviews?.org_review_count ??
    organization.reviews?.general_review_count ??
    0;
  const contacts = getDgisContacts(organization);
  const website = contacts.find((contact) => contact.kind === 'website')?.value;

  return {
    id: organization.id,
    name: organization.name,
    subtitle:
      organization.name_ex?.extension ??
      organization.name_ex?.short_name ??
      organization.type,
    rating,
    reviewCount,
    contacts,
    website,
    schedule: getDgisScheduleLabel(organization.schedule),
    latitude: organization.lat,
    longitude: organization.lon,
    isAdvertising: organization.is_advertising === true,
  };
}

export function getDgisWebsite(organization: DgisOrganization): string | undefined {
  return getDgisContacts(organization).find((contact) => contact.kind === 'website')?.value;
}

export function getDgisContacts(organization: DgisOrganization): DgisContact[] {
  const actions = organization.ads?.options?.actions ?? [];
  const uniqueContacts = new Map<string, DgisContact>();

  for (const action of actions) {
    const contact = toDgisContact(action);

    if (contact) {
      uniqueContacts.set(`${contact.kind}:${contact.value}`, contact);
    }
  }

  return [...uniqueContacts.values()];
}

function toDgisContact(action: DgisAction): DgisContact | undefined {
  const rawValue = action.value?.trim();

  if (!rawValue) {
    return undefined;
  }

  const value = unwrapDgisActionValue(rawValue);
  const kind = getDgisContactKind(action, value);
  const label = getDgisContactLabel(kind, action);
  const normalizedValue = normalizeDgisContactValue(kind, value);

  return {
    kind,
    label,
    value: normalizedValue,
    displayValue: getDgisContactDisplayValue(kind, normalizedValue, action),
    href: getDgisContactHref(kind, normalizedValue),
  };
}

function normalizeDgisContactValue(kind: DgisContactKind, value: string): string {
  return kind === 'website' || kind === 'vk' || kind === 'max'
    ? value.replace(/\/$/, '')
    : value;
}

function getDgisContactKind(action: DgisAction, value: string): DgisContactKind {
  if (action.type === 'phone' || /^\+?[\d ()-]{7,}$/.test(value)) {
    return 'phone';
  }

  if (/^mailto:/i.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email';
  }

  const host = getDgisHost(value);

  if (host === 'vk.ru' || host === 'vk.com') {
    return 'vk';
  }

  if (host === 'max.ru') {
    return 'max';
  }

  if (action.type === 'link' && /^https?:\/\//i.test(value)) {
    return 'website';
  }

  return 'other';
}

function getDgisContactLabel(kind: DgisContactKind, action: DgisAction): string {
  switch (kind) {
    case 'website':
      return 'Сайт';
    case 'phone':
      return 'Телефон';
    case 'email':
      return 'Электронная почта';
    case 'vk':
      return 'ВКонтакте';
    case 'max':
      return 'МАХ';
    default:
      return action.caption ?? action.name ?? 'Связаться';
  }
}

function getDgisContactDisplayValue(
  kind: DgisContactKind,
  value: string,
  action: DgisAction,
): string {
  if (kind === 'website') {
    return getDgisHost(value) || value.replace(/^https?:\/\//i, '');
  }

  if (kind === 'vk' || kind === 'max') {
    return 'Открыть профиль';
  }

  if (kind === 'other') {
    return action.caption ?? action.name ?? value;
  }

  return value.replace(/^mailto:/i, '');
}

function getDgisContactHref(kind: DgisContactKind, value: string): string {
  if (kind === 'phone') {
    return `tel:${value.replace(/[^\d+]/g, '')}`;
  }

  if (kind === 'email') {
    return /^mailto:/i.test(value) ? value : `mailto:${value}`;
  }

  return value;
}

function getDgisHost(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLocaleLowerCase('en-US');
  } catch {
    return '';
  }
}

function unwrapDgisActionValue(value: string): string {
  if (!value.includes('link.2gis.ru')) {
    return value;
  }

  const targetStart = value.search(/\?https?:\/\//i);
  return targetStart >= 0 ? value.slice(targetStart + 1) : value;
}

function getDgisScheduleLabel(schedule?: DgisSchedule): string | undefined {
  if (schedule?.comment) {
    return schedule.comment;
  }

  const days: Array<Exclude<keyof DgisSchedule, 'comment'>> = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];
  const firstHours = days
    .map((day) => schedule?.[day]?.working_hours?.[0])
    .find((hours) => hours?.from && hours.to);

  return firstHours?.from && firstHours.to ? `${firstHours.from}–${firstHours.to}` : undefined;
}
