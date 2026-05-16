export interface InviteRecord {
    id: string;
    createdByUserId: string;
    maxUses: number;
    usedCount: number;
    expiresAt: string | null;
    disabledAt: string | null;
    createdAt: string;
}
export interface CreateInviteRequest {
    maxUses: number;
    expiresAt?: string | null;
}
export interface CreateInviteResponse {
    inviteCode: string;
    record: InviteRecord;
}
export interface ListInvitesResponse {
    items: InviteRecord[];
}
//# sourceMappingURL=invites.d.ts.map