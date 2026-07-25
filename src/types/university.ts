export const UNIVERSITY_STATUSES = [
  "Kesin",
  "Güçlü Aday",
  "Kararsız",
  "Yedek",
  "Elendi",
] as const;

export type UniversityStatus = (typeof UNIVERSITY_STATUSES)[number];

export interface Professor {
  id: string;
  name: string;
  title: string;
  field: string;
  score: number;
  note: string;
  profileUrl?: string;
  researcherId?: string;
  orcid?: string;
  profile?: ProfessorProfile;
  profileFetchedAt?: string;
}

export interface ProfessorProfile {
  sourceUrl?: string;
  lastUpdated?: string;
  academicDuties: string[];
  education: string[];
  projects: string[];
  articles: string[];
  books: string[];
  proceedings: string[];
  externalExperience: string[];
  administrativeDuties: string[];
  awards: string[];
  patents: string[];
  memberships: string[];
  theses: string[];
  courses: string[];
}

export interface AcademicStaffSummary {
  professor: number;
  associateProfessor: number;
  doctorFacultyMember: number;
  lecturer: number;
  researchAssistant: number;
  total: number;
}

export interface RankingHistoryItem {
  year: number;
  ranking: number;
  baseScore?: number;
}

export interface UniversityProgram {
  id: string;
  universityName: string;
  programName: string;
  city: string;
  ranking: number;
  generalScore: number;
  status: UniversityStatus;
  facilities: string[];
  notes: string;
  preferenceOrder: number;
  professors: Professor[];
  atlasCode?: string;
  atlasUrl?: string;
  academicStaffUrl?: string;
  scholarship?: string;
  tuitionFee?: number;
  baseTuitionFee?: number;
  lastAtlasSyncAt?: string;
  universityType?: string;
  facultyName?: string;
  district?: string;
  pointType?: string;
  baseScore?: number;
  quota?: number;
  atlasYear?: number;
  academicHierarchy?: string;
  rankingHistory?: RankingHistoryItem[];
  educationLevel?: "Lisans" | "Önlisans";
  educationType?: string;
  educationLanguage?: string;
  educationDuration?: number;
  occupancy?: string;
  placed?: number;
  previousRanking?: number;
  previousBaseScore?: number;
  academicStaffSummary?: AcademicStaffSummary;
  createdAt: string;
  updatedAt: string;
}

export type UniversityFormValues = Pick<
  UniversityProgram,
  | "universityName"
  | "programName"
  | "city"
  | "ranking"
  | "generalScore"
  | "status"
  | "facilities"
  | "notes"
  | "professors"
  | "atlasCode"
  | "atlasUrl"
  | "academicStaffUrl"
  | "scholarship"
  | "tuitionFee"
  | "baseTuitionFee"
  | "lastAtlasSyncAt"
  | "universityType"
  | "facultyName"
  | "district"
  | "pointType"
  | "baseScore"
  | "quota"
  | "atlasYear"
  | "academicHierarchy"
  | "rankingHistory"
  | "educationLevel"
  | "educationType"
  | "educationLanguage"
  | "educationDuration"
  | "occupancy"
  | "placed"
  | "previousRanking"
  | "previousBaseScore"
  | "academicStaffSummary"
>;

export type PageKey =
  | "dashboard"
  | "profile"
  | "universities"
  | "compare"
  | "preferences"
  | "settings";
