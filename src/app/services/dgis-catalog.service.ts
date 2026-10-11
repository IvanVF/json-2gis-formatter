import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DgisResponse } from '../models/dgis-response.model';

const CATALOG_ENDPOINT = 'https://catalog.api.2gis.ru/3.0/markers/clustered';
const CATALOG_API_KEY = 'c7f1a769-c8a5-4636-b14d-d8c987808a12';
const MARKER_TYPES =
  'adm_div.city,adm_div.district,adm_div.district_area,adm_div.division,adm_div.living_area,' +
  'adm_div.place,adm_div.region,adm_div.settlement,attraction,branch,building,crossroad,foreign_city,' +
  'gate,parking,road,route,station,street,coordinates,kilometer_road_sign';
const RESPONSE_FIELDS =
  'items.ads,items.name,items.stop_factors,items.reviews,items.schedule,items.schedule_special,' +
  'items.context,items.name_ex,items.timezone_offset,items.flags,items.floor_id,items.has_exchange,' +
  'items.temporary_unavailable_atm_services,items.friends,search_attributes,items.has_ads_model';

@Injectable({ providedIn: 'root' })
export class DgisCatalogService {
  private readonly http = inject(HttpClient);

  searchOrganizations(query: string): Observable<DgisResponse> {
    const params = new HttpParams({
      fromObject: {
        key: CATALOG_API_KEY,
        map_width: '1504',
        map_height: '635',
        locale: 'ru_RU',
        q: query,
        allow_deleted: 'true',
        type: MARKER_TYPES,
        search_device_type: 'desktop',
        search_user_hash: '7077460017118786608',
        is_viewport_change: 'true',
        viewpoint1: '84.929036,56.489455',
        viewpoint2: '85.053289,56.460476',
        marker_ids:
          '70000001100202208,70000001113059108,70000001114223573,422740746344265,' +
          '70000001094132320,70000001090808080,70000001092442780,70000001048493608',
        fields: RESPONSE_FIELDS,
        'stat[sid]': '46bb6f63-ba54-404a-bb18-c15973b2922a',
        'stat[user]': '04e8c08b-d284-4636-bfcd-9cb4f5edb78c',
        shv: '2026-10-07-17',
        r: '2860787241',
      },
    });

    return this.http.get<DgisResponse>(CATALOG_ENDPOINT, { params });
  }
}
