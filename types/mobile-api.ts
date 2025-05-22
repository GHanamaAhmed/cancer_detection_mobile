// User and Authentication Types
export enum UserRole {
  PATIENT = "PATIENT",
  DOCTOR = "DOCTOR",
  DERMATOLOGIST = "DERMATOLOGIST",
  ONCOLOGIST = "ONCOLOGIST",
  PATHOLOGIST = "PATHOLOGIST",
  NURSE = "NURSE",
  ADMIN = "ADMIN",
  PROVIDER = "PROVIDER",
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  hasUnreadNotifications: boolean;
}

export interface HealthStats {
  heartRate: {
    value: number;
    unit: string;
  };
  steps: {
    value: number;
    unit: string;
  };
  // Other health metrics
}

export enum AppointmentType {
  IN_PERSON = "IN_PERSON",
  VIDEO_CONSULTATION = "VIDEO_CONSULTATION",
}

export enum AppointmentStatus {
  UPCOMING = "UPCOMING",
  PAST = "PAST",
  CANCELED = "CANCELED",
  ALL = "ALL",
  RESCHEDULED = "RESCHEDULED",
}

export interface AppointmentsListRequest {
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentsListResponse {
  appointments: AppointmentSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface AppointmentSummary {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatarUrl: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  date: string;
  time: string;
  type: AppointmentType;
  reasonForVisit?: string;
}

export interface UpdateAppointmentRequest {
  date?: string;
  time?: string;
  type?: AppointmentType;
  reasonForVisit?: string;
  status?: AppointmentStatus;
}

export enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
  UNKNOWN = "Unknown",
}

export enum DeviceType {
  SMARTWATCH = "SMARTWATCH",
  FITNESS_TRACKER = "FITNESS_TRACKER",
  BLOOD_PRESSURE_MONITOR = "BLOOD_PRESSURE_MONITOR",
  GLUCOSE_MONITOR = "GLUCOSE_MONITOR",
  SCALE = "SCALE",
  OTHER = "OTHER",
}

export enum SleepLevel {
  POOR = "POOR",
  FAIR = "FAIR",
  MODERATE = "MODERATE",
  GOOD = "GOOD",
  EXCELLENT = "EXCELLENT",
}

// Analysis Result Types
export interface AnalysisResult {
  id: string;
  title: string;
  date: string;
  riskLevel: RiskLevel;
}

export interface ResultsListRequest {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ResultsListResponse {
  results: AnalysisResultSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Add to your existing types:

export interface DeleteCaseResponse {
  success: boolean;
  message: string;
  error?: string;
}
export interface AnalysisResultSummary {
  id: string;
  title: string;
  date: string;
  riskLevel: RiskLevel;
  variant: "success" | "warning" | "destructive" | "default";
}

export interface AnalysisResultDetail {
  id: string;
  title: string;
  date: string;
  riskLevel: RiskLevel;
  confidence: number;
  keyObservations: string[];
  recommendations: string;
  abcdeCriteria: ABCDECriteria;
  similarCases: SimilarCase[];
}

export interface SimilarCase {
  id: string;
  caseNumber: string;
  imageUrl: string;
  diagnosis: string;
  riskLevel: RiskLevel;
}

// Doctor Types
export interface DoctorsListRequest {
  specialty?: string;
  name?: string;
  location?: string;
  availability?: string; // date
  page?: number;
  limit?: number;
}

export interface DoctorsListResponse {
  doctors: DoctorSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface DoctorSummary {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  status: "online" | "offline";
  avatarUrl: string;
}

export interface DoctorDetail {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  status: "online" | "offline";
  avatarUrl: string;
  experience: number; // years
  patients: number;
  specializations: string[];
  education: {
    institution: string;
    degree: string;
    years: string;
  }[];
  reviews: DoctorReview[];
}

export interface DoctorReview {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface DoctorAvailability {
  dates: {
    date: string;
    day: string;
    weekday: string;
    available: boolean;
  }[];
  timeSlots: {
    date: string;
    slots: {
      time: string;
      available: boolean;
      doctors?: number; // Number of available doctors
    }[];
  };
}

export interface ContactDoctorRequest {
  doctorId: string;
  messageType: "chat" | "video";
  message?: string;
}

// Profile Types
export interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  age?: number;
  lastExamDate?: string;
  avatarUrl?: string;
  permissions: UserPermissions;
  healthInfo: HealthInformation;
  connectedDevices: ConnectedDevice[];
}

export interface UserPermissions {
  cameraAccess: boolean;
  locationAccess: boolean;
  notifications: boolean;
}

export interface HealthInformation {
  height?: {
    value: number;
    unit: string; // cm or inches
  };
  weight?: {
    value: number;
    unit: string; // kg or lbs
  };
  bloodType?: BloodType;
  allergies?: string[];
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  isConnected: boolean;
  lastSynced?: string;
}

// Update profile request
export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

// Update health info request
export interface UpdateHealthInfoRequest {
  height?: {
    value: number;
    unit: string;
  };
  weight?: {
    value: number;
    unit: string;
  };
  bloodType?: BloodType;
  allergies?: string[];
}

// Update device request
export interface UpdateDeviceRequest {
  isConnected: boolean;
}

// Add device request
export interface AddDeviceRequest {
  name: string;
  type: DeviceType;
}

// Image Types
export interface ImageUploadRequest {
  image: File | Blob;
  metadata?: {
    bodyLocation?: string;
    notes?: string;
    captureSettings?: CaptureSettings;
  };
}

export interface CaptureSettings {
  lighting: number;
  focus: number;
  flash: number;
}

export interface ImageUploadResponse {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  qualityCheck: ImageQualityCheck;
}

export interface ImageQualityCheck {
  clarity: {
    score: number;
    status: "Good" | "Fair" | "Poor";
  };
  lighting: {
    score: number;
    status: "Good" | "Fair" | "Poor";
  };
  framing: {
    score: number;
    status: "Good" | "Fair" | "Poor";
  };
}

export interface CaptureGuidelines {
  guidelines: {
    title: string;
    description: string;
    icon: string;
  }[];
}

export interface ImageProcessingRequest {
  imageId: string;
  adjustments: {
    contrast?: number;
    brightness?: number;
    zoomLevel?: number;
  };
  filter?: "original" | "enhanced" | "grayscale" | "highContrast" | "warm";
}

export interface ImageMetadata {
  resolution: {
    width: number;
    height: number;
  };
  size: number; // in bytes
  format: string;
  dateTaken: string;
}

export interface ProcessedImageResponse {
  id: string;
  processedImageUrl: string;
}

// Onboarding Types
export interface OnboardingProgress {
  completedSteps: string[];
  currentStep: string;
  isComplete: boolean;
  age?: number;
  role?: UserRole;
  sleepLevel?: SleepLevel;
  selectedConditions?: string[];
}

export interface UpdateAgeRequest {
  age: number;
}

export interface UpdateRoleRequest {
  role: UserRole;
}

export interface UpdateSleepRequest {
  sleepLevel: SleepLevel;
  sleepHoursDaily?: number;
}

export interface UpdateConditionsRequest {
  conditions: string[];
}

export interface ConditionsListResponse {
  conditions: {
    id: string;
    name: string;
    category?: string;
  }[];
  total: number;
}

/**
 * Dashboard data received from the API
 */
export interface DashboardData {
  user?: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string;
  };
  analytics?: {
    totalScans: number;
    daysSinceLastCheck: number;
    monitoredLesions: number;
    highRiskCases: number;
    mediumRiskCases: number;
    lowRiskCases: number;
    followUpNeeded: boolean;
  };
  recentResults: Array<{
    id: string;
    title: string;
    date: string;
    riskLevel: string;
  }>;
  upcomingAppointment?: {
    id: string;
    doctorName: string;
    doctorSpecialty: string;
    date: string;
    time?: string;
  };
}

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Risk level enum to match backend
 */
export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
  UNKNOWN = "UNKNOWN",
}

/**
 * Case status enum to match backend
 */
export enum CaseStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  MONITORING = "MONITORING",
  FOLLOW_UP = "FOLLOW_UP",
  REFERRED = "REFERRED",
}

/**
 * Lesion type enum to match backend
 */
export enum LesionType {
  MELANOMA = "MELANOMA",
  BASAL_CELL_CARCINOMA = "BASAL_CELL_CARCINOMA",
  SQUAMOUS_CELL_CARCINOMA = "SQUAMOUS_CELL_CARCINOMA",
  ACTINIC_KERATOSIS = "ACTINIC_KERATOSIS",
  NEVUS = "NEVUS",
  SEBORRHEIC_KERATOSIS = "SEBORRHEIC_KERATOSIS",
  OTHER = "OTHER",
  UNKNOWN = "UNKNOWN",
}

/**
 * Body location enum to match backend
 */
export enum BodyLocation {
  HEAD = "HEAD",
  NECK = "NECK",
  CHEST = "CHEST",
  BACK = "BACK",
  ABDOMEN = "ABDOMEN",
  ARMS = "ARMS",
  HANDS = "HANDS",
  LEGS = "LEGS",
  FEET = "FEET",
  OTHER = "OTHER",
}

/**
 * Appointment status enum to match backend
 */
export enum AppointmentStatus {
  REQUESTED = "REQUESTED",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

/**
 * Lesion case data structure
 */
export interface LesionCase {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  lesionType: LesionType;
  bodyLocation?: BodyLocation;
  symptoms?: string;
  createdAt: string;
  updatedAt: string;
  images: Array<ImageUpload>;
  analysisResults: Array<AnalysisResult>;
}

/**
 * Image upload data structure
 */
export interface ImageUpload {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  captureDate: string;
  bodyLocation?: BodyLocation;
  lesionSize?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Analysis result data structure
 */
export interface AnalysisResult {
  id: string;
  riskLevel: RiskLevel;
  confidence: number;
  lesionType: LesionType;
  observations?: string;
  recommendations?: string;
  reviewedByDoctor: boolean;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
  abcdeResults?: ABCDECriteria;
}

/**
 * ABCDE criteria for skin lesion analysis
 */
export interface ABCDECriteria {
  asymmetry: boolean;
  asymmetryScore?: number;
  border: boolean;
  borderScore?: number;
  color: boolean;
  colorScore?: number;
  diameter: boolean;
  diameterValue?: number;
  evolution: boolean;
  evolutionNotes?: string;
  totalFlags: number;
}

// Add these types to your existing file

/**
 * History data received from the API
 */
export interface HistoryData {
  history: LesionCaseHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Individual lesion case history item
 */
export interface LesionCaseHistory {
  id: string;
  caseNumber: string;
  date: string;
  formattedDate: string;
  status: string;
  riskLevel: RiskLevel;
  lesionType: LesionType;
  bodyLocation?: BodyLocation;
  diagnosis?: string;
  imageCount: number;
  mainImage: {
    id: string;
    url: string;
    thumbnailUrl?: string;
  } | null;
  latestAnalysis: {
    id: string;
    riskLevel: RiskLevel;
    confidence: number;
    lesionType: LesionType;
    reviewedByDoctor: boolean;
    abcdeFlags: number;
  } | null;
}

// Add these types to your existing file

/**
 * Result detail data received from the API
 */
export interface ResultDetailData {
  id: string;
  caseNumber: string;
  createdAt: string;
  updatedAt: string;
  formattedDate: string;
  status: string;
  riskLevel: RiskLevel;
  lesionType: LesionType;
  bodyLocation?: BodyLocation;
  firstNoticed?: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentPlan?: string;

  images: CaseImage[];
  latestAnalysis?: AnalysisDetail;
  nextAppointment?: AppointmentDetail;
  notes: CaseNote[];
}

export interface CaseImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  captureDate: string;
  bodyLocation?: BodyLocation;
  lesionSize?: number;
  notes?: string;
  createdAt: string;
}

export interface AnalysisDetail {
  id: string;
  riskLevel: RiskLevel;
  confidence: number;
  lesionType: LesionType;
  observations?: string;
  recommendations?: string;
  reviewedByDoctor: boolean;
  doctorNotes?: string;
  createdAt: string;
  formattedDate: string;
  analyst: {
    name: string;
    role: string;
  };
  abcdeResults?: {
    asymmetry: boolean;
    asymmetryScore?: number;
    border: boolean;
    borderScore?: number;
    color: boolean;
    colorScore?: number;
    diameter: boolean;
    diameterValue?: number;
    evolution: boolean;
    evolutionNotes?: string;
    totalFlags: number;
  };
  similarCases: Array<{
    id: string;
    caseNumber: string;
    imageUrl: string;
    diagnosis: string;
    riskLevel: RiskLevel;
    similarityScore?: number;
  }>;
}

export interface AppointmentDetail {
  id: string;
  date: string;
  formattedDate: string;
  formattedTime: string;
  type: string;
  location?: string;
  doctor: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  formattedDate: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    avatarUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
  patient: {
    height?: number;
    weight?: number;
    allergies?: string;
    skinType?: number;
    familyHistory?: boolean;
    previousMelanoma?: boolean;
    sunscreenUse?: boolean;
    lastExamDate?: string;
  } | null;
  settings: {
    darkMode: boolean;
    enableNotifications: boolean;
    enableCameraAccess: boolean;
    enableLocationAccess: boolean;
    language: string;
  };
}

export interface ProfileUpdateData {
  name?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  patient?: {
    height?: number;
    weight?: number;
    allergies?: string;
    skinType?: number;
    familyHistory?: boolean;
    previousMelanoma?: boolean;
    sunscreenUse?: boolean;
    lastExamDate?: string;
  };
  settings?: {
    darkMode?: boolean;
    enableNotifications?: boolean;
    enableCameraAccess?: boolean;
    enableLocationAccess?: boolean;
    language?: string;
  };
}

// Add these types to your existing types file

export interface Doctor {
  id: string;
  name: string;
  image?: string;
  role: string;
  specialties: string[];
  consultationFee?: number;
  rating?: number;
  bio?: string;
  location?: string;
}

export interface AvailabilityDate {
  date: string;
  dayOfWeek: string;
  day: number;
  month: string;
  slots: {
    time: string;
    formattedDate: string;
  }[];
}

export interface Appointment {
  id: string;
  doctor: {
    id: string;
    name: string;
    image?: string;
    role: string;
    specialties?: string[];
    phoneNumber?: string;
    facility?: any;
  };
  date: string;
  formattedDate: string;
  formattedTime: string;
  duration: number;
  type: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  location?: string;
  case?: {
    id: string;
    caseNumber: string;
    riskLevel: string;
    bodyLocation?: string;
  } | null;
  followUpNeeded?: boolean;
  notes?: string;
  consultationFee?: number;
}

export interface StatusBadgeStyle {
  bg: string;
  text: string;
  label: string;
}

export interface AppointmentApiResponse {
  data: Appointment;
  success: boolean;
}
