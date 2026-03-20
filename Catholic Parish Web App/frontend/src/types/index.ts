export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  parishId: string;
  roles: string[];
}

export interface Parish {
  id: string;
  name: string;
  address: string;
  diocese: string;
  contactInfo: Record<string, string>;
  logoPath?: string;
}

export interface Family {
  id: string;
  parishId: string;
  parish_id?: string;
  familyName: string;
  family_name?: string;
  address?: string;
  status: 'active' | 'inactive' | 'transferred' | 'deceased';
  notes?: string;
  memberCount?: number;
  member_count?: number;
  members?: Person[];
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  primaryFamilyId?: string;
  primary_family_id?: string;
  firstName: string;
  first_name?: string;
  middleName?: string;
  middle_name?: string;
  lastName: string;
  last_name?: string;
  maidenName?: string;
  maiden_name?: string;
  baptismalName?: string;
  baptismal_name?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'deceased' | 'transferred';
  familyName?: string;
  family_name?: string;
  relationship?: string;
  sacraments?: SacramentRecord[];
  families?: { id: string; familyName: string; relationship: string }[];
}

export interface SacramentType {
  id: string;
  code: string;
  name: string;
  sequenceOrder: number;
}

export interface SacramentRecord {
  id: string;
  personId: string;
  person_id?: string;
  sacramentTypeId: string;
  sacrament_type_id?: string;
  parishId: string;
  parish_id?: string;
  date?: string;
  celebrant?: string;
  celebrantRole?: string;
  celebrant_role?: string;
  registerVolume?: string;
  register_volume?: string;
  registerPage?: string;
  register_page?: string;
  place?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  code?: string;
  name?: string;
  sacramentName?: string;
  sacrament_name?: string;
  sequenceOrder?: number;
  sequence_order?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  sponsors?: Sponsor[];
}

export interface Sponsor {
  id?: string;
  name: string;
  role: string;
}

export interface CertificateTemplate {
  id: string;
  parishId: string;
  parish_id?: string;
  sacramentTypeId: string;
  sacrament_type_id?: string;
  name: string;
  htmlTemplate: string;
  html_template?: string;
  isDefault: boolean;
  is_default?: boolean;
  sacramentName?: string;
  sacrament_name?: string;
  sacramentCode?: string;
  sacrament_code?: string;
}

export interface Certificate {
  id: string;
  sacramentId: string;
  templateId?: string;
  generatedAt: string;
  storagePath?: string;
  hashOrQrToken: string;
  sacramentName?: string;
  firstName?: string;
  lastName?: string;
  downloadUrl?: string;
}

export interface CertificateRequest {
  id: string;
  requestedByPersonId: string;
  requested_by_person_id?: string;
  sacramentTypeId: string;
  sacrament_type_id?: string;
  personId: string;
  person_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  reason?: string;
  fulfilledCertificateId?: string;
  fulfilled_certificate_id?: string;
  sacramentName?: string;
  sacrament_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  createdAt: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user_id?: string;
  entityType: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  action: string;
  beforeSnapshot?: Record<string, unknown>;
  before_snapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  after_snapshot?: Record<string, unknown>;
  timestamp: string;
  email?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
}

export interface ReportSummary {
  totalFamilies: string;
  totalPeople: string;
  totalSacraments: string;
  totalCertificates: string;
  pendingRequests: string;
}

export const SACRAMENT_COLORS: Record<string, string> = {
  BAPTISM: 'bg-blue-100 text-blue-800',
  EUCHARIST: 'bg-yellow-100 text-yellow-800',
  PENANCE: 'bg-purple-100 text-purple-800',
  CONFIRMATION: 'bg-orange-100 text-orange-800',
  MATRIMONY: 'bg-pink-100 text-pink-800',
  HOLY_ORDERS: 'bg-navy-100 text-navy-800',
  ANOINTING: 'bg-green-100 text-green-800',
};

export const ROLES = {
  ADMIN: 'parish_admin',
  CLERK: 'sacramental_clerk',
  PRIEST: 'priest',
  AUDITOR: 'auditor',
  PARISHIONER: 'parishioner',
} as const;
