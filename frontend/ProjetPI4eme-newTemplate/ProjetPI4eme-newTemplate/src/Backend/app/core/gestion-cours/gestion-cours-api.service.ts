import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export type CourseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ClassroomType = 'STANDARD' | 'PREMIUM' | 'MEETING';
export type CourseKind = 'ONLINE' | 'ONSITE';

export interface ApiResponse<T> {
  data?: T;
  payload?: T;
  result?: T;
  message?: string;
}

export interface OnlineCourseDto {
  id: number;
  title: string;
  description?: string | null;
  level: CourseLevel;
  tutorId: number;
}

export interface OnSiteCourseDto {
  id: number;
  title: string;
  description?: string | null;
  level: CourseLevel;
  tutorId: number;
  classroomName?: string | null;
}

export interface ClassroomDto {
  id: number;
  name: string;
  capacity: number;
  type: ClassroomType;
  featuresDescription?: string | null;
  sketchfabModelUid?: string | null;
}

export interface OnlineCourseRequest {
  title: string;
  description?: string;
  level: CourseLevel;
  tutorId: number;
}

export interface OnSiteCourseRequest {
  title: string;
  description?: string;
  level: CourseLevel;
  tutorId: number;
  classroomName?: string;
}

export interface ClassroomRequest {
  name: string;
  capacity: number;
  type: ClassroomType;
  featuresDescription?: string;
  sketchfabModelUid?: string;
}

@Injectable({ providedIn: 'root' })
export class GestionCoursApiService {
  private readonly http = inject(HttpClient);

  listOnlineCourses(): Observable<OnlineCourseDto[]> {
    return this.http.get<ApiResponse<OnlineCourseDto[]>>('/api/v1/onlinecourses/all').pipe(
      map((response) => this.unwrapList(response))
    );
  }

  listOnSiteCourses(): Observable<OnSiteCourseDto[]> {
    return this.http.get<ApiResponse<OnSiteCourseDto[]>>('/api/v1/onsitecourses/all').pipe(
      map((response) => this.unwrapList(response))
    );
  }

  getOnlineCourseById(id: number): Observable<OnlineCourseDto | null> {
    return this.http.get<ApiResponse<OnlineCourseDto>>(`/api/v1/onlinecourses/${id}`).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  getOnSiteCourseById(id: number): Observable<OnSiteCourseDto | null> {
    return this.http.get<ApiResponse<OnSiteCourseDto>>(`/api/v1/onsitecourses/${id}`).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  createOnlineCourse(payload: OnlineCourseRequest): Observable<OnlineCourseDto | null> {
    return this.http.post<ApiResponse<OnlineCourseDto>>('/api/v1/onlinecourses/add', payload).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  createOnSiteCourse(payload: OnSiteCourseRequest): Observable<OnSiteCourseDto | null> {
    return this.http.post<ApiResponse<OnSiteCourseDto>>('/api/v1/onsitecourses/add', payload).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  updateOnlineCourse(id: number, payload: OnlineCourseRequest): Observable<OnlineCourseDto | null> {
    return this.http.put<ApiResponse<OnlineCourseDto>>(`/api/v1/onlinecourses/update/${id}`, payload).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  updateOnSiteCourse(id: number, payload: OnSiteCourseRequest): Observable<OnSiteCourseDto | null> {
    return this.http.put<ApiResponse<OnSiteCourseDto>>(`/api/v1/onsitecourses/update/${id}`, payload).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  deleteOnlineCourse(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/onlinecourses/delete/${id}`);
  }

  deleteOnSiteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/onsitecourses/delete/${id}`);
  }

  listClassrooms(): Observable<ClassroomDto[]> {
    return this.http.get<ApiResponse<ClassroomDto[]>>('/api/v1/classrooms/all').pipe(
      map((response) => this.unwrapList(response))
    );
  }

  createClassroom(payload: ClassroomRequest): Observable<ClassroomDto | null> {
    return this.http.post<ApiResponse<ClassroomDto>>('/api/v1/classrooms/add', payload).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  updateClassroom(id: number, payload: ClassroomRequest): Observable<ClassroomDto | null> {
    return this.http.put<ApiResponse<ClassroomDto>>(`/api/v1/classrooms/update/${id}`, payload).pipe(
      map((response) => this.unwrapOne(response))
    );
  }

  deleteClassroom(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/classrooms/delete/${id}`);
  }

  private unwrapList<T>(response: ApiResponse<T[]> | T[] | null | undefined): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response?.data ?? response?.payload ?? response?.result ?? [];
  }

  private unwrapOne<T>(response: ApiResponse<T> | T | null | undefined): T | null {
    if (response == null) {
      return null;
    }
    if (typeof response === 'object' && !Array.isArray(response) && ('data' in response || 'payload' in response || 'result' in response)) {
      return (response.data ?? response.payload ?? response.result ?? null) as T | null;
    }
    return response as T;
  }
}
