import type { EcoReportStatus, EcoReportType, ListingStatus, MarketRequestStatus, MarketStatus, VerificationStatus } from './types';

export const fishTypes = ['Сазан', 'Кефаль', 'Судак', 'Вобла', 'Осетр', 'Килька'];
export const fishIcons = ['🐟', '🐠', '🐡', '🦈'];

export const verificationLabels: Record<VerificationStatus, string> = {
  pending: 'На проверке',
  approved: 'Подтвержден',
  rejected: 'Отклонен',
};

export const marketLabels: Record<MarketStatus, string> = {
  not_listed: 'Не на рынке',
  listed: 'На рынке',
  sold: 'Продан',
};

export const listingLabels: Record<ListingStatus, string> = {
  active: 'Активен',
  sold: 'Продан',
  cancelled: 'Отменён',
};

export const marketRequestLabels: Record<MarketRequestStatus, string> = {
  open: 'Открыт',
  accepted: 'Принят',
  completed: 'Завершён',
};

export const ecoTypeLabels: Record<EcoReportType, string> = {
  pollution: 'Загрязнение',
  trash: 'Мусор',
  dead_fish: 'Мёртвая рыба',
  illegal_nets: 'Незаконные сети',
};

export const ecoStatusLabels: Record<EcoReportStatus, string> = {
  pending: 'На проверке',
  approved: 'Подтверждена',
  rejected: 'Отклонена',
};

export function toNumber(value: number | string) {
  return typeof value === 'number' ? value : Number.parseFloat(value);
}

export function formatKg(value: number | string) {
  return `${toNumber(value).toLocaleString('ru-RU')} кг`;
}

export function formatPrice(value: number | string) {
  return `${toNumber(value).toLocaleString('ru-RU')} ₸`;
}
