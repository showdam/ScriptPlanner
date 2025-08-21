// 공통 타입 정의

export interface ScriptAnalysis {
  metadata: {
    title: string;
    totalScenes: number;
    locations: string[];
    characters: Character[];
    createdAt: Date;
    fileInfo: {
      originalName: string;
      size: number;
      type: string;
    };
  };
  scenes: Scene[];
}

export interface Scene {
  episode: number;
  sceneNumber: string; // "1", "L", "0", "8", "9" 등
  timeOfDay: 'D' | 'N' | 'DN'; // DAY/NIGHT/DAY&NIGHT
  location: string; // "카페 내부", "학교 운동장" 등
  setting: 'L' | 'S'; // 실내(Location)/실외(Set)
  storyDay: string; // "DAY1", "DAY2", "DAY3" 등
  content: string; // 씬 내용/대사 요약
  characters: string[]; // 등장인물 목록
  props: string[]; // 소품 목록
  artDept: string[]; // 미술 관련 요구사항
  costume: string[]; // 의상 관련 요구사항
  makeup: string[]; // 분장/미용 관련 요구사항
  notes: string; // 특수 요구사항/비고
  shootingOrder?: number; // 촬영 순서 (사용자가 조정 가능)
}

export interface Character {
  name: string;
  appearances: number; // 등장 씬 수
  isMain: boolean; // 주요 등장인물 여부
  scenes: string[]; // 등장하는 씬 번호들
}

export interface ShootingSchedule {
  projectInfo: {
    title: string;
    episode: number;
    shootingDate: string;
    director: string;
    writer: string;
    producer: string;
    callTime: string;
    workHours: string;
    sunrise: string;
    sunset: string;
  };
  mainCharacters: string[]; // 최대 5명
  scenes: ScheduleScene[];
  callTimes: CallTime[];
  locations: LocationInfo[];
  staff: StaffInfo;
}

export interface ScheduleScene extends Scene {
  shootingOrder: number;
  estimatedDuration?: string; // 예상 촬영 시간
  characterMarkers: { [character: string]: boolean }; // 등장인물 마커 (●)
  extras: string; // 보조출연자
}

export interface CallTime {
  character: string;
  makeupTime: string;
  readyTime: string;
}

export interface LocationInfo {
  name: string;
  address: string;
  scenes: string[]; // 해당 장소에서 촬영할 씬들
}

export interface StaffInfo {
  assistantDirector?: string;
  floorDirector?: string;
  scriptSupervisor?: string;
  locationManager?: string;
  artDirector?: string;
  makeupArtist?: string;
}

// API 관련 타입들
export interface UploadResponse {
  success: boolean;
  fileId: string;
  extractedText: string;
  message?: string;
}

export interface AnalysisRequest {
  fileId: string;
  extractedText: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis: ScriptAnalysis;
  message?: string;
}

export interface GenerateScheduleRequest {
  analysis: ScriptAnalysis;
  userSelections: {
    mainCharacters: string[];
    shootingOrder: 'ai' | 'manual';
    customOrder?: Scene[];
    projectInfo: ShootingSchedule['projectInfo'];
    callTimes?: CallTime[];
    staff?: StaffInfo;
  };
}

export interface GenerateScheduleResponse {
  success: boolean;
  downloadUrl: string;
  filename: string;
  message?: string;
}

// 에러 타입
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// 파일 처리 관련
export interface FileProcessingStatus {
  status: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export const SUPPORTED_FILE_TYPES = {
  PDF: '.pdf',
  DOCX: '.docx',
  DOC: '.doc'
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB