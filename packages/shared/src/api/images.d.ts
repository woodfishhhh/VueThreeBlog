export type ImageId = string;
export type ImageSource = "web" | "typora" | "cli" | "api" | "migration";
export type ImageVariantKind = "original" | "webp" | "thumb";
export interface ImageVariant {
    kind: ImageVariantKind;
    mime: string;
    relativePath: string;
    publicUrl: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
}
export interface ImageRecord {
    id: ImageId;
    ownerUserId: string;
    displayName: string;
    altText: string | null;
    source: ImageSource;
    hash: string;
    originalMime: string;
    originalExt: string;
    width: number;
    height: number;
    sizeBytes: number;
    defaultVariant: ImageVariantKind;
    createdAt: string;
    deletedAt: string | null;
    variants: ImageVariant[];
}
export interface UploadImageResponse {
    id: ImageId;
    displayName: string;
    width: number;
    height: number;
    sizeBytes: number;
    mime: string;
    hash: string;
    url: string;
    originalUrl: string;
    thumbnailUrl: string | null;
    markdown: string;
    createdAt: string;
    /**
     * GIFs may keep original as default `url` in MVP.
     * Consumers must not assume this is always WebP.
     */
    defaultVariant: "webp" | "original";
}
export interface ListImagesResponse {
    items: ImageRecord[];
    nextCursor: string | null;
}
//# sourceMappingURL=images.d.ts.map