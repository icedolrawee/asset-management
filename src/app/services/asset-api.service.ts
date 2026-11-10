import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface AssetRecord {
  id: number; assetNumber: string | null; itemName: string; brand: string | null; model: string | null; serialNumber: string | null;
  imagePath: string | null; departmentName: string | null; budgetYear: number | null;
  isCheckedOut: boolean | number; borrowerName: string | null; checkoutAssetNumber: string | null; checkoutLocation: string | null; checkoutRoom: string | null; checkedOutAt: string | null;
  location: string | null; room: string | null; status: 'ใช้งาน' | 'ชำรุด' | 'จำหน่าย'; notes: string | null; createdAt: string; updatedAt: string;
}
export interface AssetListResponse { success: boolean; data: AssetRecord[]; pagination: { page: number; pageSize: number; total: number }; }
export interface CheckoutUser { id: number; email: string; displayName: string; }
export interface CheckoutRecord { id: number; assetId: number; borrowerUserId: number | null; borrowerName: string; borrowerEmail?: string | null; assetNumber: string; location: string; room: string; checkedOutAt: string; itemName: string; serialNumber: string | null; imagePath: string | null; status: 'ใช้งาน' | 'ชำรุด' | 'จำหน่าย'; departmentName: string | null; budgetYear: number | null; }
export interface CreateAssetPayload {
  itemName: string; serialNumber?: string; assetNumber?: string; brand?: string; model?: string;
  departmentName?: string; budgetYear?: number | null; location?: string; room?: string; notes?: string; image?: File | null;
}
@Injectable({ providedIn: 'root' })
export class AssetApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:4000/api';
  getAssets(search = '', status = '', page = 1, pageSize = 5): Observable<AssetListResponse> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) params = params.set('search', search.trim());
    if (status) params = params.set('status', status);
    return this.http.get<AssetListResponse>(this.baseUrl + '/assets', { params });
  }
  getCheckoutUsers(): Observable<{ success: boolean; data: CheckoutUser[] }> {
    return this.http.get<{ success: boolean; data: CheckoutUser[] }>(this.baseUrl + '/auth/users');
  }
  getCheckouts(): Observable<{ success: boolean; data: CheckoutRecord[] }> {
    return this.http.get<{ success: boolean; data: CheckoutRecord[] }>(this.baseUrl + '/assets/checkouts');
  }
  cancelCheckout(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(this.baseUrl + '/assets/checkouts/' + id);
  }
  updateCheckout(id: number, payload: { borrowerUserId: number; location: string; room: string }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(this.baseUrl + '/assets/checkouts/' + id, payload);
  }
  checkoutAsset(id: number, payload: { borrowerUserId: number; assetNumber: string; location: string; room: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.baseUrl + '/assets/' + id + '/checkout', payload);
  }
  getCheckoutHistory(id: number): Observable<{ success: boolean; data: Array<{ id: number; borrowerName: string; assetNumber: string; location: string; room: string; checkedOutAt: string; returnedAt: string | null; checkedOutBy: string }> }> {
    return this.http.get<{ success: boolean; data: Array<{ id: number; borrowerName: string; assetNumber: string; location: string; room: string; checkedOutAt: string; returnedAt: string | null; checkedOutBy: string }> }>(this.baseUrl + '/assets/' + id + '/checkout-history');
  }
  deleteAsset(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(this.baseUrl + '/assets/' + id);
  }
  updateAssetStatus(id: number, status: AssetRecord['status']): Observable<{ success: boolean; message: string; data: { id: number; status: AssetRecord['status'] } }> {
    return this.http.patch<{ success: boolean; message: string; data: { id: number; status: AssetRecord['status'] } }>(this.baseUrl + '/assets/' + id + '/status', { status });
  }
  updateAsset(id: number, payload: CreateAssetPayload): Observable<{ success: boolean; message: string; data: { id: number; itemName: string; serialNumber: string | null; imagePath: string | null; budgetYear?: number | null } }> {
    const data = {
      itemName: payload.itemName.trim(),
      serialNumber: payload.serialNumber?.trim() || null,
      assetNumber: payload.assetNumber?.trim() || null,
      brand: payload.brand?.trim() || null,
      model: payload.model?.trim() || null,
      departmentName: payload.departmentName?.trim() || null,
      budgetYear: payload.budgetYear === null || payload.budgetYear === undefined || String(payload.budgetYear).trim() === '' ? null : Number(payload.budgetYear),
      location: payload.location?.trim() || null,
      room: payload.room?.trim() || null,
      notes: payload.notes?.trim() || null,
    };
    if (!payload.image) {
      return this.http.put<{ success: boolean; message: string; data: { id: number; itemName: string; serialNumber: string | null; imagePath: string | null; budgetYear?: number | null } }>(this.baseUrl + '/assets/' + id, data);
    }
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== null) body.append(key, String(value)); });
    body.append('image', payload.image);
    return this.http.put<{ success: boolean; message: string; data: { id: number; itemName: string; serialNumber: string | null; imagePath: string | null; budgetYear?: number | null } }>(this.baseUrl + '/assets/' + id, body);
  }
  createAsset(payload: CreateAssetPayload): Observable<{ success: boolean; message: string; data: { id: number; itemName: string; serialNumber: string | null; imagePath: string | null; budgetYear?: number | null } }> {
    const data = {
      itemName: payload.itemName.trim(),
      serialNumber: payload.serialNumber?.trim() || null,
      assetNumber: payload.assetNumber?.trim() || null,
      brand: payload.brand?.trim() || null,
      model: payload.model?.trim() || null,
      departmentName: payload.departmentName?.trim() || null,
      budgetYear: payload.budgetYear === null || payload.budgetYear === undefined || String(payload.budgetYear).trim() === '' ? null : Number(payload.budgetYear),
      location: payload.location?.trim() || null,
      room: payload.room?.trim() || null,
      notes: payload.notes?.trim() || null,
    };
    if (!payload.image) {
      return this.http.post<{ success: boolean; message: string; data: { id: number; itemName: string; serialNumber: string | null; imagePath: string | null; budgetYear?: number | null } }>(this.baseUrl + '/assets', data);
    }
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== null) body.append(key, String(value)); });
    body.append('image', payload.image);
    return this.http.post<{ success: boolean; message: string; data: { id: number; itemName: string; serialNumber: string | null; imagePath: string | null; budgetYear?: number | null } }>(this.baseUrl + '/assets', body);
  }
}
