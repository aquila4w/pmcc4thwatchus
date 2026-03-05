/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
/* NOTE: Additional components added manually for Cloudflare R2 integration */

import { Logo as Logo_0 } from "@/app/(payload)/admin/components/Logo";
import { Icon as Icon_1 } from "@/app/(payload)/admin/components/Icon";
import { Dashboard as Dashboard_2 } from "@/app/(payload)/admin/components/Dashboard";
import { InviteLinkField as InviteLinkField_3 } from "@/app/(payload)/admin/components/InviteLinkField";

// S3 Storage client components for Cloudflare R2
import { S3ClientUploadHandler as S3ClientUploadHandler_4 } from "@payloadcms/storage-s3/client";
// CollectionCards for dashboard
import { CollectionCards as CollectionCards_5 } from "@payloadcms/next/rsc";

export const importMap = {
  "/app/(payload)/admin/components/Logo#Logo": Logo_0,
  "/app/(payload)/admin/components/Icon#Icon": Icon_1,
  "/app/(payload)/admin/components/Dashboard#Dashboard": Dashboard_2,
  "/app/(payload)/admin/components/InviteLinkField#InviteLinkField": InviteLinkField_3,
  // S3 Storage for Cloudflare R2
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_4,
  // CollectionCards for dashboard
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_5,
};
