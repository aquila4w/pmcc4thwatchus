import type { CollectionConfig, Where } from "payload";

// Generate a readable invite code (6 chars) + UUID suffix for uniqueness
const generateInviteCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let readable = "";
  for (let i = 0; i < 6; i++) {
    readable += chars[Math.floor(Math.random() * chars.length)];
  }
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${readable}-${suffix}`;
};

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "name",
    group: "Admin",
    defaultColumns: ["name", "email", "role", "status", "church", "inviteCode"],
    description: "Manage members, guests, and administrators",
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
  },
  access: {
    // Anyone can read basic user info (needed for invites)
    read: ({ req: { user } }): boolean | Where => {
      if (!user) {
        // Public can only see approved members (for invite pages)
        return {
          status: { equals: "approved" },
        } as Where;
      }
      if (["superAdmin", "districtCoordinator"].includes(user.role)) return true;
      // Head ministers and secretaries can see users in their church
      if (["headMinister", "secretary"].includes(user.role) && user.church) {
        return {
          or: [
            { id: { equals: String(user.id) } },
            { church: { equals: user.church } },
            { status: { equals: "pending" } },
          ],
        } as Where;
      }
      // Users can read their own data
      return { id: { equals: String(user.id) } } as Where;
    },
    // Allow public registration
    create: () => true,
    update: ({ req: { user } }): boolean | Where => {
      if (!user) return false;
      if (["superAdmin", "districtCoordinator"].includes(user.role)) return true;
      // Head ministers and secretaries can update users in their church
      if (["headMinister", "secretary"].includes(user.role) && user.church) {
        return {
          church: { equals: user.church },
        } as Where;
      }
      // Users can update their own data
      return { id: { equals: String(user.id) } } as Where;
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    // Basic Info
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      admin: {
        description: "Phone number for contact and event invitations",
      },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Profile picture",
      },
    },

    // Account Status (for approval workflow)
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending Approval", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Suspended", value: "suspended" },
      ],
      admin: {
        position: "sidebar",
        description: "Account status - new registrations start as pending",
      },
      access: {
        // Only admins can change status
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ["superAdmin", "districtCoordinator", "subDistrictCoordinator"].includes(user.role);
        },
      },
    },

    // Role
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "member",
      options: [
        { label: "Super Admin", value: "superAdmin" },
        { label: "District Coordinator", value: "districtCoordinator" },
        { label: "Sub-District Coordinator", value: "subDistrictCoordinator" },
        { label: "Head Minister", value: "headMinister" },
        { label: "Secretary", value: "secretary" },
        { label: "Member", value: "member" },
        { label: "Guest", value: "guest" },
      ],
      admin: {
        position: "sidebar",
      },
      access: {
        // Only superAdmin can assign roles
        update: ({ req: { user } }) => {
          if (!user) return false;
          return user.role === "superAdmin";
        },
      },
    },

    // Church Assignment
    {
      name: "church",
      type: "relationship",
      relationTo: "churches",
      admin: {
        position: "sidebar",
        description: "The local church this member belongs to",
      },
      access: {
        // SuperAdmin, district coordinators, or church leaders can assign
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
        },
      },
    },

    // Sub-District (auto-populated based on church)
    {
      name: "subDistrict",
      type: "relationship",
      relationTo: "sub-districts",
      admin: {
        position: "sidebar",
        description: "Auto-populated based on church assignment",
        readOnly: true,
      },
    },

    // SSO Provider Info
    {
      name: "authProvider",
      type: "select",
      options: [
        { label: "Email/Password", value: "credentials" },
        { label: "Google", value: "google" },
        { label: "Facebook", value: "facebook" },
        { label: "Apple", value: "apple" },
      ],
      defaultValue: "credentials",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "How this user registered",
      },
    },
    {
      name: "authProviderId",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "External provider user ID",
        condition: (data) => data?.authProvider !== "credentials",
      },
    },

    // Invite Code (for approved members)
    {
      name: "inviteCode",
      type: "text",
      unique: true,
      admin: {
        position: "sidebar",
        description: "Unique code for event invitation links",
        readOnly: true,
      },
    },
    {
      name: "inviteLink",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "/app/(payload)/admin/components/InviteLinkField#InviteLinkField",
        },
        condition: (data) => data?.status === "approved" && data?.inviteCode,
      },
    },

    // Bio
    {
      name: "bio",
      type: "textarea",
      admin: {
        description: "Short biography",
      },
    },

    // Approval tracking
    {
      name: "approvedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.status === "approved",
      },
    },
    {
      name: "approvedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.status === "approved",
      },
    },
    {
      name: "churchAssignedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => !!data?.church,
      },
    },
    {
      name: "churchAssignedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => !!data?.church,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Generate invite code for new approved users
        if (operation === "create" && !data.inviteCode) {
          data.inviteCode = generateInviteCode();
        }

        // Track approval
        if (data.status === "approved" && originalDoc?.status !== "approved") {
          data.approvedAt = new Date().toISOString();
          if (req.user) {
            data.approvedBy = req.user.id;
          }
          // Generate invite code if not exists
          if (!data.inviteCode) {
            data.inviteCode = generateInviteCode();
          }
        }

        // Track church assignment
        if (data.church && data.church !== originalDoc?.church) {
          data.churchAssignedAt = new Date().toISOString();
          if (req.user) {
            data.churchAssignedBy = req.user.id;
          }
        }

        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Auto-populate subDistrict based on church
        if (doc.church && operation === "update") {
          try {
            const church = await req.payload.findByID({
              collection: "churches",
              id: typeof doc.church === "string" ? doc.church : doc.church.id,
            });
            if (church?.subDistrict) {
              await req.payload.update({
                collection: "users",
                id: doc.id,
                data: {
                  subDistrict: typeof church.subDistrict === "string"
                    ? church.subDistrict
                    : church.subDistrict.id,
                },
              });
            }
          } catch (error) {
            console.error("Failed to auto-populate subDistrict:", error);
          }
        }
      },
    ],
  },
  timestamps: true,
};
