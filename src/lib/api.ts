/**
 * API Utilities for Payload CMS
 *
 * These utilities provide a clean interface for interacting with the Payload CMS
 * REST API for events, registrations, campaigns, and other collections.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

interface ApiResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

interface ApiError {
  message: string;
  status: number;
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// ============ Events API ============

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  address?: string;
  status: "draft" | "published" | "archived";
  requiresRegistration: boolean;
  hasBaptism: boolean;
  maxAttendees?: number;
  featuredImage?: {
    url: string;
    alt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function getEvents(params?: {
  status?: string;
  limit?: number;
  page?: number;
}): Promise<ApiResponse<Event>> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.append("where[status][equals]", params.status);
  }
  if (params?.limit) {
    searchParams.append("limit", params.limit.toString());
  }
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }

  const query = searchParams.toString();
  return fetchAPI<ApiResponse<Event>>(`/events${query ? `?${query}` : ""}`);
}

export async function getEvent(idOrSlug: string): Promise<Event> {
  // Try to fetch by ID first, then by slug
  try {
    return await fetchAPI<Event>(`/events/${idOrSlug}`);
  } catch {
    const response = await fetchAPI<ApiResponse<Event>>(
      `/events?where[slug][equals]=${idOrSlug}&limit=1`
    );
    if (response.docs.length === 0) {
      throw new Error("Event not found");
    }
    return response.docs[0];
  }
}

export async function createEvent(data: Partial<Event>): Promise<Event> {
  return fetchAPI<Event>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  return fetchAPI<Event>(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ============ Event Registrations API ============

export interface EventRegistration {
  id: string;
  inviteCode: string;
  event: string | Event;
  guest?: string | User;
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  status: "invited" | "registered" | "attended" | "baptized";
  invitedBy?: string | User;
  registeredAt?: string;
  attendedAt?: string;
  baptizedAt?: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export async function getRegistrations(eventId: string, params?: {
  status?: string;
  limit?: number;
  page?: number;
}): Promise<ApiResponse<EventRegistration>> {
  const searchParams = new URLSearchParams();
  searchParams.append("where[event][equals]", eventId);

  if (params?.status) {
    searchParams.append("where[status][equals]", params.status);
  }
  if (params?.limit) {
    searchParams.append("limit", params.limit.toString());
  }
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }

  return fetchAPI<ApiResponse<EventRegistration>>(
    `/event-registrations?${searchParams.toString()}`
  );
}

export async function getRegistrationByCode(inviteCode: string): Promise<EventRegistration | null> {
  const response = await fetchAPI<ApiResponse<EventRegistration>>(
    `/event-registrations?where[inviteCode][equals]=${inviteCode}&limit=1`
  );
  return response.docs[0] || null;
}

export async function createRegistration(data: {
  event: string;
  invitedBy?: string;
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}): Promise<EventRegistration> {
  return fetchAPI<EventRegistration>("/event-registrations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRegistration(
  id: string,
  data: Partial<EventRegistration>
): Promise<EventRegistration> {
  return fetchAPI<EventRegistration>(`/event-registrations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function checkInGuest(inviteCode: string, checkedInBy?: string): Promise<EventRegistration> {
  const registration = await getRegistrationByCode(inviteCode);

  if (!registration) {
    throw new Error("Registration not found");
  }

  if (registration.status === "attended" || registration.status === "baptized") {
    throw new Error("Guest already checked in");
  }

  return updateRegistration(registration.id, {
    status: "attended",
    attendedAt: new Date().toISOString(),
  });
}

export async function markBaptized(registrationId: string): Promise<EventRegistration> {
  return updateRegistration(registrationId, {
    status: "baptized",
    baptizedAt: new Date().toISOString(),
  });
}

// ============ Campaigns API ============

export interface Campaign {
  id: string;
  name: string;
  event: string | Event;
  type: "sms" | "email" | "both";
  subject?: string;
  smsContent?: string;
  emailContent?: string;
  frequency: "once" | "daily" | "weekly" | "custom";
  scheduledAt?: string;
  targetAudience: "all" | "notAttended" | "attended" | "notBaptized";
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  sentCount: number;
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCampaigns(params?: {
  event?: string;
  status?: string;
  limit?: number;
  page?: number;
}): Promise<ApiResponse<Campaign>> {
  const searchParams = new URLSearchParams();

  if (params?.event) {
    searchParams.append("where[event][equals]", params.event);
  }
  if (params?.status) {
    searchParams.append("where[status][equals]", params.status);
  }
  if (params?.limit) {
    searchParams.append("limit", params.limit.toString());
  }
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }

  const query = searchParams.toString();
  return fetchAPI<ApiResponse<Campaign>>(`/campaigns${query ? `?${query}` : ""}`);
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  return fetchAPI<Campaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  return fetchAPI<Campaign>(`/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ============ Churches API ============

export interface Church {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  subDistrict: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export async function getChurches(params?: {
  subDistrict?: string;
  limit?: number;
}): Promise<ApiResponse<Church>> {
  const searchParams = new URLSearchParams();

  if (params?.subDistrict) {
    searchParams.append("where[subDistrict][equals]", params.subDistrict);
  }
  if (params?.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  const query = searchParams.toString();
  return fetchAPI<ApiResponse<Church>>(`/churches${query ? `?${query}` : ""}`);
}

// ============ QR Code Generation ============

export function generateQRCodeUrl(data: string, size: number = 300): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
}

export function generateInviteLink(eventSlug: string, inviteCode: string): string {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : API_BASE_URL;
  return `${baseUrl}/register/${eventSlug}?code=${inviteCode}`;
}

// ============ Utility Functions ============

export function generateInviteCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatEventTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
