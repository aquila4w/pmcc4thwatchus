import type { CollectionConfig, Where } from "payload";

export const EventInvites: CollectionConfig = {
  slug: "event-invites",
  admin: {
    useAsTitle: "inviteCode",
    group: "Event Management",
    defaultColumns: ["invitedBy", "event", "memberContactName", "registrationCount"],
    description: "Unique invite links for members to share events",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      // Members can see their own invites
      if (user.role === "guest" || user.role === "member") {
        return {
          invitedBy: { equals: user.id },
        } as Where;
      }
      // Church leaders can see invites from their church
      if (["headMinister", "secretary"].includes(user.role) && user.church) {
        return {
          church: { equals: user.church },
        } as Where;
      }
      // Subdistrict coordinators can see invites from their subdistrict
      if (user.role === "subDistrictCoordinator" && user.subDistrict) {
        return {
          subDistrict: { equals: user.subDistrict },
        } as Where;
      }
      // District coordinators, event admins, and super admins can see all
      return true;
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      // Only superAdmin, districtCoordinator, and eventAdmin can update (regenerate)
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    // Invite Code (UUID, not guessable)
    {
      name: "inviteCode",
      type: "text",
      required: true,
      unique: true,
      indexed: true,
      admin: {
        description: "Unique UUID invite code (not guessable)",
        position: "sidebar",
      },
    },
    // Event
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
      indexed: true,
      admin: {
        description: "The event this invite is for",
      },
    },
    // Inviting Member
    {
      name: "invitedBy",
      type: "relationship",
      relationTo: "users",
      required: true,
      indexed: true,
      admin: {
        description: "The member who generated this invite",
      },
    },
    // Church (auto-populated from member)
    {
      name: "church",
      type: "relationship",
      relationTo: "churches",
      admin: {
        description: "Church of the inviting member",
        position: "sidebar",
        readOnly: true,
      },
    },
    // Sub-District (auto-populated from member)
    {
      name: "subDistrict",
      type: "relationship",
      relationTo: "sub-districts",
      admin: {
        description: "Sub-district of the inviting member",
        position: "sidebar",
        readOnly: true,
      },
    },
    // Member Contact Info (auto-populated from invitedBy)
    {
      name: "memberContactName",
      type: "text",
      admin: {
        description: "Name of the inviting member",
        readOnly: true,
      },
    },
    {
      name: "memberContactPhone",
      type: "text",
      admin: {
        description: "Phone of the inviting member",
        readOnly: true,
      },
    },
    {
      name: "memberContactEmail",
      type: "text",
      admin: {
        description: "Email of the inviting member",
        readOnly: true,
      },
    },
    // Virtual field for registration count
    {
      name: "registrationCount",
      type: "number",
      admin: {
        description: "Number of guests registered through this invite",
        position: "sidebar",
        readOnly: true,
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            try {
              const registrations = await req.payload.find({
                collection: "event-registrations",
                where: {
                  eventInvite: { equals: data.id },
                },
                limit: 0,
              });
              return registrations.totalDocs;
            } catch {
              return 0;
            }
          },
        ],
      },
    },
    // Invite Link UI Field
    {
      name: "inviteLink",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "/app/(payload)/admin/components/EventInviteLinkField#EventInviteLinkField",
        },
      },
    },
    // Invite Status (for tracking)
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Disabled", value: "disabled" },
        { label: "Expired", value: "expired" },
      ],
      admin: {
        position: "sidebar",
        description: "Status of this invite link",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Generate UUID for invite code on create
        if (operation === "create" && !data.inviteCode) {
          data.inviteCode = crypto.randomUUID();
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Auto-populate church and subDistrict from member
        if (operation === "create" && doc.invitedBy) {
          try {
            const member = await req.payload.findByID({
              collection: "users",
              id: typeof doc.invitedBy === "string" ? doc.invitedBy : doc.invitedBy.id,
              depth: 0,
            });

            if (member) {
              const updateData: Record<string, unknown> = {};
              if (member.church && !doc.church) {
                updateData.church = member.church;
              }
              if (member.subDistrict && !doc.subDistrict) {
                updateData.subDistrict = member.subDistrict;
              }
              if (member.name && !doc.memberContactName) {
                updateData.memberContactName = member.name;
              }
              if (member.phone && !doc.memberContactPhone) {
                updateData.memberContactPhone = member.phone;
              }
              if (member.email && !doc.memberContactEmail) {
                updateData.memberContactEmail = member.email;
              }

              if (Object.keys(updateData).length > 0) {
                await req.payload.update({
                  collection: "event-invites",
                  id: doc.id,
                  data: updateData,
                });
              }
            }
          } catch (error) {
            console.error("Failed to auto-populate member info:", error);
          }
        }
      },
    ],
  },
  timestamps: true,
};
