// 애플리케이션 상수

export const SCRIPT_CONFIG = {
  MAX_LENGTH: 5000,
  DEFAULT_FONT_SIZE: 11,
  DEFAULT_LINE_SPACING: 160, // 160%
  MARGIN: {
    TOP: 1440, // twips (2.54cm)
    BOTTOM: 1440,
    LEFT: 1440,
    RIGHT: 1440
  }
} as const;

export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.txt', '.hwp', '.doc', '.docx'],
  SUPPORTED_FORMATS: {
    TEXT: 'text/plain',
    HWP: 'application/octet-stream',
    DOC: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
} as const;

export const PARSING_RULES = {
  SCENE_PATTERNS: [
    /^#S\s+(.+)$/i,         // #S 제목 (공백 필수)
    /^#\s*(.+)$/,           // # 제목
    /^S\d*\s+(.+)$/i,       // S 제목, S1 제목, S2 제목 등 (공백 필수)
    /^씬\d*\s+(.+)$/,       // 씬 제목, 씬1 제목, 씬2 제목 등 (공백 필수)
  ],
  SENTENCE_SEPARATORS: /([.!?。！？])/,
  DIALOGUE_SEPARATOR: ':'
} as const;

export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  ANIMATION_DURATION: 200, // ms
  TOAST_DURATION: 3000, // ms
  COLORS: {
    PRIMARY: '#1565c0',
    SECONDARY: '#0d47a1',
    SUCCESS: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3'
  }
} as const;

export const API_ENDPOINTS = {
  PARSE: '/api/parse',
  UPLOAD: '/api/upload',
  EXPORT: {
    HWP: '/api/export/hwp',
    WORD: '/api/export/word',
    PDF: '/api/export/pdf'
  }
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.',
  UNSUPPORTED_FORMAT: '지원되지 않는 파일 형식입니다.',
  UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
  PARSE_FAILED: '스크립트 분석에 실패했습니다.',
  EXPORT_FAILED: '파일 내보내기에 실패했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: '파일을 성공적으로 업로드했습니다.',
  EXPORT_COMPLETED: '파일을 성공적으로 내보냈습니다.',
  SCRIPT_PARSED: '스크립트를 성공적으로 분석했습니다.'
} as const;