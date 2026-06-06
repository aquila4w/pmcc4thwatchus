import type { CollectionConfig, Where } from "payload";
import { randomInt, randomBytes } from "crypto";

// Generate a readable invite code (6 chars) + random suffix for uniqueness
const generateInviteCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let readable = "";
  for (let i = 0; i < 6; i++) {
    readable += chars[randomInt(chars.length)];
  }
  const suffix = randomBytes(3).toString("hex").toUpperCase();
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
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          const adminRoles = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"];
          return adminRoles.includes(user.role);
        },
      },
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
        // Only admins can read status
        read: ({ req: { user } }) => {
          if (!user) return false;
          const adminRoles = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"];
          return adminRoles.includes(user.role);
        },
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
        { label: "Event Admin", value: "eventAdmin" },
        { label: "Head Minister", value: "headMinister" },
        { label: "Secretary", value: "secretary" },
        { label: "Associate Minister", value: "associateMinister" },
        { label: "Bible Student", value: "bibleStudent" },
        { label: "Elder", value: "elder" },
        { label: "AMP Intern", value: "ampIntern" },
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

    // Sub-District (auto-populated based on church, editable by superAdmin)
    {
      name: "subDistrict",
      type: "relationship",
      relationTo: "sub-districts",
      admin: {
        position: "sidebar",
        description: "Auto-populated based on church assignment",
        condition: (data, { user }) => {
          if (user?.role === "superAdmin") return true;
          return !!data?.subDistrict;
        },
      },
      access: {
        update: ({ req: { user } }) => {
          if (!user) return false;
          return user.role === "superAdmin";
        },
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
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          const adminRoles = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"];
          return adminRoles.includes(user.role);
        },
      },
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "How this user registered",
      },
    },
    {
      name: "authProviderId",
      type: "text",
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          const adminRoles = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"];
          return adminRoles.includes(user.role);
        },
      },
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "External provider user ID",
        condition: (data) => data?.authProvider !== "credentials",
      },
    },

    // Force password change on next login
    {
      name: "forcePasswordChange",
      type: "checkbox",
      defaultValue: false,
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return true;
        },
      },
      admin: {
        position: "sidebar",
        description: "User must change their password on next login",
      },
    },

    // Invite Code (for approved members)
    {
      name: "inviteCode",
      type: "text",
      unique: true,
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          const adminRoles = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"];
          return adminRoles.includes(user.role);
        },
      },
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
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          const adminRoles = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"];
          return adminRoles.includes(user.role);
        },
      },
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
    // Guest Promotion Tracking
    {
      name: "promotedFromGuestAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "When this user was promoted from guest to member",
        condition: (data) => !!data?.promotedFromGuestAt,
      },
    },
    {
      name: "promotedFromGuestBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "User who promoted this guest to member",
        condition: (data) => !!data?.promotedFromGuestAt,
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
      async ({ doc, req, operation, previousDoc }) => {
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

        // When user is approved, auto-generate invites for all future registration-open events
        const wasJustApproved = doc.status === "approved" &&
          (!previousDoc || previousDoc.status !== "approved");

        if (wasJustApproved) {
          try {
            // Find all future events with registration open
            const events = await req.payload.find({
              collection: "managed-events",
              where: {
                and: [
                  { status: { equals: "registration-open" } },
                  { startDate: { greater_than: new Date().toISOString() } },
                ],
              },
              limit: 100,
              depth: 0,
            });

            // Get roles eligible for invites (same filter as ManagedEvents hook)
            const eligibleRoles = ["member", "eventAdmin", "headMinister", "secretary", "subDistrictCoordinator", "districtCoordinator", "superAdmin", "associateMinister", "bibleStudent", "elder", "ampIntern"];

            if (eligibleRoles.includes(doc.role)) {
              let createdCount = 0;
              for (const event of events.docs) {
                // Check if invite already exists for this member+event combo
                const existing = await req.payload.find({
                  collection: "event-invites",
                  where: {
                    and: [
                      { event: { equals: event.id } },
                      { invitedBy: { equals: doc.id } },
                    ],
                  },
                  limit: 1,
                });

                if (existing.totalDocs === 0) {
                  await req.payload.create({
                    collection: "event-invites",
                    data: {
                      event: event.id,
                      invitedBy: doc.id,
                      status: "active",
                    },
                  });
                  createdCount++;
                }
              }

              if (createdCount > 0) {
                console.log(`Auto-generated ${createdCount} event invites for newly approved member: ${doc.name}`);
              }
            }
          } catch (error) {
            console.error("Failed to auto-generate invites for approved member:", error);
          }
        }
      },
    ],
  },
  timestamps: true,
};
