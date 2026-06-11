import axios from 'axios';
import type {
  Analytics,
  CatchItem,
  CreateCatchPayload,
  CreateEcoReportPayload,
  CreateMarketRequestPayload,
  EcoReport,
  MapMarker,
  MarketListing,
  MarketRequest,
  SellerReview,
  User,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function login(email: string, password: string) {
  const { data } = await api.post<User>('/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string) {
  const { data } = await api.post<User>('/auth/register', { email, password });
  return data;
}

export async function getMe(email: string) {
  const { data } = await api.get<User>('/users/me', { params: { email } });
  return data;
}

export async function getCatches(userId?: number) {
  const { data } = await api.get<CatchItem[]>('/catches', { params: { userId } });
  return data;
}

export async function getApprovedCatches() {
  const { data } = await api.get<CatchItem[]>('/catches/approved');
  return data;
}

export async function getPendingCatches() {
  const { data } = await api.get<CatchItem[]>('/catches/pending');
  return data;
}

export async function createCatch(payload: CreateCatchPayload) {
  const { data } = await api.post<CatchItem>('/catches', payload);
  return data;
}

export async function approveCatch(id: number, inspectorComment: string) {
  const { data } = await api.patch<CatchItem>(`/catches/${id}/approve`, { inspectorComment });
  return data;
}

export async function rejectCatch(id: number, inspectorComment: string) {
  const { data } = await api.patch<CatchItem>(`/catches/${id}/reject`, { inspectorComment });
  return data;
}

export async function getMarket() {
  const { data } = await api.get<MarketListing[]>('/market');
  return data;
}

export async function createListing(catchId: number, sellerId: number, price: number) {
  const { data } = await api.post<MarketListing>('/market/listing', { catchId, sellerId, price });
  return data;
}

export async function removeListing(id: number) {
  const { data } = await api.delete(`/market/listing/${id}`);
  return data;
}

export async function addReview(listingId: number, payload: Pick<SellerReview, 'sellerId' | 'reviewerEmail' | 'rating' | 'comment'>) {
  const { data } = await api.post<SellerReview>(`/market/${listingId}/review`, payload);
  return data;
}

export async function getMarketRequests() {
  const { data } = await api.get<MarketRequest[]>('/market/requests');
  return data;
}

export async function createMarketRequest(payload: CreateMarketRequestPayload) {
  const { data } = await api.post<MarketRequest>('/market/requests', payload);
  return data;
}

export async function removeMarketRequest(id: number) {
  const { data } = await api.delete(`/market/requests/${id}`);
  return data;
}

export async function getEcoReports() {
  const { data } = await api.get<EcoReport[]>('/eco-reports');
  return data;
}

export async function getPendingEcoReports() {
  const { data } = await api.get<EcoReport[]>('/eco-reports/pending');
  return data;
}

export async function createEcoReport(payload: CreateEcoReportPayload) {
  const { data } = await api.post<EcoReport>('/eco-reports', payload);
  return data;
}

export async function approveEcoReport(id: number, inspectorComment: string) {
  const { data } = await api.patch<EcoReport>(`/eco-reports/${id}/approve`, { inspectorComment });
  return data;
}

export async function rejectEcoReport(id: number, inspectorComment: string) {
  const { data } = await api.patch<EcoReport>(`/eco-reports/${id}/reject`, { inspectorComment });
  return data;
}

export async function getMapMarkers() {
  const { data } = await api.get<MapMarker[]>('/map/markers');
  return data;
}

export async function updateMapMarkerNote(
  markerId: string,
  action: 'add_plus' | 'add_minus' | 'remove_plus' | 'remove_minus',
  text: string,
) {
  const { data } = await api.patch(`/map/markers/${encodeURIComponent(markerId)}/notes`, { action, text });
  return data;
}

export async function getAnalytics() {
  const { data } = await api.get<Analytics>('/analytics');
  return data;
}
