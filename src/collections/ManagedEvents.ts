import type { CollectionConfig } from "payload";
import { layoutBlocks } from "../blocks";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 200;

/** Retry a single operation with exponential backoff for MongoDB M0 transient errors */
async function retryOp<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = /retry|transaction|timeout|temporarily/i.test(msg);
      if (attempt >= retries || !isTransient) throw err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}

/** Pause between batches to avoid overwhelming MongoDB M0 free tier */
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generate member + church invites in batched background process */
async function generateInvitesInBackground(
  req: { payload: import("payload").Payload },
  eventId: string,
  eventTitle: string,
) {
  // --- Member invites ---
  try {
    const [members, existingInvites] = await Promise.all([
      retryOp(() =>
        req.payload.find({
          collection: "users",
          where: {
            and: [
              { status: { equals: "approved" } },
              {
                role: {
                  in: ["member", "eventAdmin", "headMinister", "secretary", "subDistrictCoordinator", "districtCoordinator", "superAdmin"],
                },
              },
            ],
          },
          limit: 999,
          depth: 0,
        })
      ),
      retryOp(() =>
        req.payload.find({
          collection: "event-invites",
          where: { event: { equals: eventId } },
          limit: 0,
          depth: 0,
        })
      ),
    ]);

    const existingMemberIds = new Set(
      existingInvites.docs.map((invite: unknown) => {
        const invitedBy = (invite as { invitedBy?: unknown }).invitedBy;
        return typeof invitedBy === "string" ? invitedBy : (invitedBy as { id?: string })?.id;
      })
    );

    const toCreate = members.docs.filter((m) => {
      const mid = typeof m.id === "string" ? m.id : String(m.id);
      return !existingMemberIds.has(mid);
    });

    let createdCount = 0;
    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((member) =>
          retryOp(() =>
            req.payload.create({
              collection: "event-invites",
              data: {
                event: eventId,
                invitedBy: member.id,
                status: "active",
              },
            })
          ).catch(() => {})
        )
      );
      createdCount += batch.length;
      if (i + BATCH_SIZE < toCreate.length) await pause(BATCH_DELAY_MS);
    }

    if (createdCount > 0) {
      console.log(`Auto-generated ${createdCount} event invites for: ${eventTitle}`);
    }
  } catch (error) {
    console.error("Failed to auto-generate event invites:", error);
  }

  // --- Church invites ---
  try {
    const [churches, placements, existingChurchInvites] = await Promise.all([
      retryOp(() =>
        req.payload.find({
          collection: "churches",
          limit: 200,
          depth: 0,
          overrideAccess: true,
        })
      ),
      retryOp(() =>
        req.payload.find({
          collection: "ad-placements",
          where: { status: { equals: "active" } },
          limit: 100,
          depth: 0,
          overrideAccess: true,
        })
      ),
      retryOp(() =>
        req.payload.find({
          collection: "church-event-invites",
          where: { event: { equals: eventId } },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        })
      ),
    ]);

    if (churches.totalDocs > 0 && placements.totalDocs > 0) {
      const existingCombos = new Set(
        existingChurchInvites.docs.map((ci: Record<string, unknown>) =>
          `${ci.church}-${ci.adPlacement}`
        )
      );

      const combos: { churchId: string; placementId: string }[] = [];
      for (const church of churches.docs) {
        for (const placement of placements.docs) {
          const key = `${church.id}-${placement.id}`;
          if (!existingCombos.has(key)) {
            combos.push({
              churchId: String(church.id),
              placementId: String(placement.id),
            });
          }
        }
      }

      let churchInviteCount = 0;
      for (let i = 0; i < combos.length; i += BATCH_SIZE) {
        const batch = combos.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(({ churchId, placementId }) =>
            retryOp(() =>
              req.payload.create({
                collection: "church-event-invites",
                data: {
                  event: eventId,
                  church: churchId,
                  adPlacement: placementId,
                  status: "active",
                },
                depth: 0,
                overrideAccess: true,
              })
            ).catch(() => {})
          )
        );
        churchInviteCount += batch.length;
        if (i + BATCH_SIZE < combos.length) await pause(BATCH_DELAY_MS);
      }

      if (churchInviteCount > 0) {
        console.log(`Auto-generated ${churchInviteCount} church invites for: ${eventTitle}`);
      }
    }
  } catch (error) {
    console.error("Failed to auto-generate church event invites:", error);
  }
}

export const ManagedEvents: CollectionConfig = {
  slug: "managed-events",
  admin: {
    useAsTitle: "title",
    group: "Event Management",
    defaultColumns: ["title", "startDate", "location", "status", "registrationCount"],
    description: "Admin-only: Manage events with registration, QR codes, and check-in",
  },
  access: {
    read: ({ req: { user } }) => {
      // Only authenticated users can see managed events
      if (!user) return false;
      return true;
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    // ===================
    // BASIC INFO
    // ===================
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "Event name",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-friendly identifier for registration links",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Brief description of the event",
      },
    },

    // ===================
    // STATUS
    // ===================
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Open for Registration", value: "registration-open" },
        { label: "Registration Closed", value: "registration-closed" },
        { label: "In Progress", value: "in-progress" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        position: "sidebar",
        description: "Event status",
      },
    },

    // ===================
    // SCHEDULE & LOCATION
    // ===================
    {
      type: "tabs",
      tabs: [
        {
          label: "Schedule & Location",
          fields: [
            {
              name: "startDate",
              type: "date",
              required: true,
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "Event start date and time",
              },
            },
            {
              name: "endDate",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "Event end date and time",
              },
            },
            {
              name: "location",
              type: "text",
              required: true,
              admin: {
                description: "Venue name",
              },
            },
            {
              name: "address",
              type: "textarea",
              admin: {
                description: "Full address of the venue",
              },
            },
            {
              name: "coordinates",
              type: "group",
              admin: {
                description: "For map display",
              },
              fields: [
                { name: "lat", type: "number", admin: { width: "50%" } },
                { name: "lng", type: "number", admin: { width: "50%" } },
              ],
            },
          ],
        },
        {
          label: "Registration Settings",
          fields: [
            {
              name: "registrationEnabled",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Enable online registration for this event",
              },
            },
            {
              name: "registrationDeadline",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "Last date to register",
              },
            },
            {
              name: "maxAttendees",
              type: "number",
              admin: {
                description: "Maximum number of attendees (leave empty for unlimited)",
              },
            },
            {
              name: "requireApproval",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Require admin approval for registrations",
              },
            },
            {
              name: "hasBaptism",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Does this event include a baptism ceremony?",
              },
            },
            {
              name: "registrationFields",
              type: "array",
              admin: {
                description: "Additional fields to collect during registration",
              },
              fields: [
                {
                  name: "fieldName",
                  type: "text",
                  required: true,
                },
                {
                  name: "fieldType",
                  type: "select",
                  defaultValue: "text",
                  options: [
                    { label: "Text", value: "text" },
                    { label: "Email", value: "email" },
                    { label: "Phone", value: "phone" },
                    { label: "Select", value: "select" },
                    { label: "Checkbox", value: "checkbox" },
                  ],
                },
                {
                  name: "required",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "options",
                  type: "text",
                  admin: {
                    description: "Comma-separated options (for select fields)",
                    condition: (data, siblingData) => siblingData?.fieldType === "select",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Registration Page",
          description: "Customize the registration page",
          fields: [
            {
              name: "heroImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Header image for registration page",
              },
            },
            {
              name: "contentMode",
              type: "select",
              defaultValue: "richtext",
              options: [
                { label: "Rich Text Editor", value: "richtext" },
                { label: "Block Builder", value: "blocks" },
                // { label: "Visual Page Builder (Puck)", value: "puck" }, // DISABLED FOR TESTING
              ],
              admin: {
                description: "Choose how to edit content",
              },
            },
            {
              name: "registrationIntro",
              type: "richText",
              admin: {
                description: "Introduction text shown on registration page",
                condition: (data) => data?.contentMode === "richtext" || !data?.contentMode,
              },
            },
            {
              name: "pageLayout",
              type: "blocks",
              blocks: layoutBlocks,
              admin: {
                description: "Additional content blocks for registration page",
                condition: (data) => data?.contentMode === "blocks",
              },
            },
            // {
            //   name: "puckData",
            //   type: "json",
            //   admin: {
            //     description: "Visual page builder data",
            //     condition: (data) => data?.contentMode === "puck",
            //   },
            // },
            // {
            //   name: "editWithPuck",
            //   type: "ui",
            //   admin: {
            //     condition: (data) => data?.contentMode === "puck",
            //     components: {
            //       Field: "/app/(payload)/admin/components/PuckEditorButton#PuckEditorButton",
            //     },
            //   },
            // },
          ],
        },
        {
          label: "Thank You Page",
          fields: [
            {
              name: "thankYouTitle",
              type: "text",
              defaultValue: "Thank You for Registering!",
            },
            {
              name: "thankYouMessage",
              type: "richText",
              admin: {
                description: "Message shown after successful registration",
              },
            },
            {
              name: "showQRCode",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Show QR code on thank you page",
              },
            },
            {
              name: "sendConfirmationEmail",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Send confirmation email with QR code",
              },
            },
            // Landing Page Configuration
            {
              name: "landingPageHeroImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Hero image for the post-registration landing page",
              },
            },
            {
              name: "landingPageTitle",
              type: "text",
              defaultValue: "You're Registered!",
              admin: {
                description: "Title shown on the landing page",
              },
            },
            {
              name: "landingPageContent",
              type: "richText",
              admin: {
                description: "Content shown on the landing page",
              },
            },
            {
              name: "landingPageShowQR",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Show QR code on the landing page",
              },
            },
            {
              name: "landingPageShowInviter",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Show the inviting member's contact information",
              },
            },
            {
              name: "landingPageCTA",
              type: "text",
              admin: {
                description: "Call-to-action button text",
              },
            },
            {
              name: "landingPageCTALink",
              type: "text",
              admin: {
                description: "Call-to-action button link",
              },
            },
          ],
        },
        {
          label: "Check-In Settings",
          fields: [
            {
              name: "checkInEnabled",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Enable QR code check-in for this event",
              },
            },
            {
              name: "allowMultipleCheckIns",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Allow checking in the same QR code multiple times",
              },
            },
            {
              name: "checkInStartTime",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "When check-in opens (defaults to event start)",
              },
            },
            {
              name: "walkInEnabled",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Allow walk-in registrations at the registration booth",
              },
            },
            {
              name: "walkInCode",
              type: "text",
              admin: {
                description: "Special code for walk-in registrations (auto-generated if blank when walk-in is enabled)",
                condition: (data) => data?.walkInEnabled,
              },
              hooks: {
                beforeChange: [
                  ({ data, operation }) => {
                    if (operation === "create" && data?.walkInEnabled && !data?.walkInCode) {
                      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                      let code = "WI-";
                      for (let i = 0; i < 6; i++) {
                        code += chars[Math.floor(Math.random() * chars.length)];
                      }
                      data.walkInCode = code;
                    }
                    return data;
                  },
                ],
              },
            },
          ],
        },
      ],
    },

    // ===================
    // SIDEBAR FIELDS
    // ===================
    {
      name: "organizer",
      type: "relationship",
      relationTo: "churches",
      admin: {
        position: "sidebar",
        description: "Organizing church",
      },
    },
    {
      name: "eventType",
      type: "select",
      defaultValue: "general",
      options: [
        { label: "General Event", value: "general" },
        { label: "Crusade", value: "crusade" },
        { label: "Conference", value: "conference" },
        { label: "Training", value: "training" },
        { label: "Worship Service", value: "worship" },
        { label: "Youth Event", value: "youth" },
        { label: "Baptism", value: "baptism" },
      ],
      admin: {
        position: "sidebar",
      },
    },

    // Virtual field for registration count (computed)
    {
      name: "registrationCount",
      type: "number",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Total registrations (auto-calculated)",
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            try {
              // Use raw MongoDB countDocuments() instead of payload.find({ limit: 0 })
              // to avoid Payload middleware overhead that caused 40+ second queries on serverless
              const mongooseModel = req.payload.db.collections["event-registrations"];
              return await mongooseModel.countDocuments({ event: data.id });
            } catch {
              return 0;
            }
          },
        ],
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Auto-generate slug from title if not provided
        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Auto-generate EventInvite entries when event is created or status changes to registration-open
        const shouldGenerateInvites =
          operation === "create" ||
          (operation === "update" &&
            doc.status === "registration-open" &&
            // Check if status just changed to registration-open
            (!previousDoc || previousDoc.status !== "registration-open"));

        if (shouldGenerateInvites && doc.status === "registration-open" && doc.startDate && new Date(doc.startDate) > new Date()) {
          // Run invite generation in the background to avoid blocking the response
          // and hitting MongoDB M0 free tier transaction limits
          const eventId = typeof doc.id === "string" ? doc.id : String(doc.id);

          // Fire-and-forget: don't await, let it run in background
          generateInvitesInBackground(req, eventId, doc.title).catch((err) => {
            console.error("Background invite generation failed:", err);
          });
        }
      },
    ],
  },
};
