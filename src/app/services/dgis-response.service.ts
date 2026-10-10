import { Injectable } from '@angular/core';
import { DgisResponse } from '../models/dgis-response.model';

@Injectable({ providedIn: 'root' })
export class DgisResponseService {
  async loadResponse(): Promise<DgisResponse> {
    const response = await fetch('/response-2gis.txt');

    if (!response.ok) {
      throw new Error(`Не удалось загрузить response-2gis.txt: ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!this.isDgisResponse(payload)) {
      throw new Error('Файл не похож на ответ поиска 2ГИС.');
    }

    return payload;
  }

  private isDgisResponse(payload: unknown): payload is DgisResponse {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const response = payload as Partial<DgisResponse>;
    const result = response.result;

    return Boolean(
      response.meta &&
        result &&
        Array.isArray(result.items) &&
        typeof result.total === 'number',
    );
  }
}
