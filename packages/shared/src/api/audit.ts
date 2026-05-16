export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  tokenId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  ip: string | null;
  userAgent: string | null;
  metadataJson: string | null;
  createdAt: string;
}

export interface ListAuditLogsResponse {
  items: AuditLogRecord[];
  nextCursor: string | null;
}
