// 스크립트 관련 타입 정의

export interface ScriptElement {
  type: 'scene' | 'action' | 'dialogue';
  text: string;
}

export interface SceneElement extends ScriptElement {
  type: 'scene';
  number: number;
  title: string;
}

export interface ActionElement extends ScriptElement {
  type: 'action';
}

export interface DialogueElement extends ScriptElement {
  type: 'dialogue';
  character: string;
}

export type ParsedScriptElement = SceneElement | ActionElement | DialogueElement;

// 파일 업로드 관련 타입
export interface FileUploadResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface FileUploadOptions {
  maxSize?: number; // bytes
  allowedExtensions?: string[];
}

// 내보내기 관련 타입
export interface ExportOptions {
  format: 'hwp' | 'word' | 'pdf';
  fontSize?: number;
  lineSpacing?: number;
  margin?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ExportResult {
  success: boolean;
  data?: Buffer | Blob;
  error?: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 컴포넌트 props 타입
export interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload?: (file: File) => void;
  maxLength?: number;
}

export interface PreviewPanelProps {
  content: string;
  parsedElements: ParsedScriptElement[];
}

export interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onUploadComplete: (result: FileUploadResult) => void;
  accept?: string;
  maxSize?: number;
}

export interface ExportButtonProps {
  format: ExportOptions['format'];
  content: string;
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (result: ExportResult) => void;
}

// 상태 관리 타입
export interface AppState {
  scriptContent: string;
  parsedElements: ParsedScriptElement[];
  isLoading: boolean;
  error: string | null;
  uploadProgress?: number;
}

export interface AppActions {
  setScriptContent: (content: string) => void;
  setParsedElements: (elements: ParsedScriptElement[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUploadProgress: (progress: number) => void;
}