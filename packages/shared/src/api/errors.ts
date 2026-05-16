export type RequestId = string;

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID_TOKEN"
  | "AUTH_FORBIDDEN"
  | "AUTH_EXPIRED_TOKEN"
  | "INVITE_INVALID"
  | "INVITE_EXPIRED"
  | "INVITE_DISABLED"
  | "INVITE_EXHAUSTED"
  | "UPLOAD_TOO_LARGE"
  | "UPLOAD_UNSUPPORTED_TYPE"
  | "UPLOAD_PROCESSING_FAILED"
  | "IMAGE_NOT_FOUND"
  | "IMAGE_DELETE_FORBIDDEN"
  | "TOKEN_NOT_FOUND"
  | "TOKEN_REVOKED"
  | "TOKEN_SCOPE_DENIED"
  | "USER_NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  requestId: RequestId;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}
