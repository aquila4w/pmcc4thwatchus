// Shared test fixtures - mock data used across all test files

export const mockSuperAdmin = {
  id: "admin-1",
  name: "Super Admin",
  email: "admin@pmcc4thwatch.us",
  phone: "+15551001000",
  role: "superAdmin",
  status: "approved",
  inviteCode: "ADMIN01A1",
  church: "church-1",
  subDistrict: "subdistrict-1",
};

export const mockDistrictCoordinator = {
  id: "dc-1",
  name: "District Coordinator",
  email: "dc@pmcc4thwatch.us",
  role: "districtCoordinator",
  status: "approved",
  inviteCode: "DC001B2C3",
};

export const mockSubDistrictCoordinator = {
  id: "sdc-1",
  name: "Sub-District Coordinator",
  email: "sdc@pmcc4thwatch.us",
  role: "subDistrictCoordinator",
  status: "approved",
  inviteCode: "SDC001D4E5",
};

export const mockEventAdmin = {
  id: "eventadmin-1",
  name: "Event Admin",
  email: "eventadmin@pmcc4thwatch.us",
  role: "eventAdmin",
  status: "approved",
  inviteCode: "EVTADM01",
};

export const mockHeadMinister = {
  id: "hm-1",
  name: "Head Minister",
  email: "hm@pmcc4thwatch.us",
  role: "headMinister",
  status: "approved",
  inviteCode: "HM001F6G7",
  church: "church-1",
};

export const mockSecretary = {
  id: "sec-1",
  name: "Secretary",
  email: "sec@pmcc4thwatch.us",
  role: "secretary",
  status: "approved",
  inviteCode: "SEC001H8I9",
  church: "church-1",
};

export const mockMember = {
  id: "member-1",
  name: "John Member",
  email: "john@example.com",
  phone: "+15551002000",
  role: "member",
  status: "approved",
  inviteCode: "MEMBR01A2",
  church: "church-1",
  subDistrict: "subdistrict-1",
};

export const mockGuest = {
  id: "guest-1",
  name: "Jane Guest",
  email: "jane@example.com",
  phone: "+15551003000",
  role: "guest",
  status: "approved",
  authProvider: "event-registration",
};

export const mockChurch = {
  id: "church-1",
  name: "PMCC LA Church",
  slug: "pmcc-la",
  city: "Los Angeles",
  state: "CA",
  phone: "+15551005000",
  email: "la@pmcc4thwatch.us",
  subDistrict: "subdistrict-1",
  headMinister: "hm-1",
  secretary: "sec-1",
};

export const mockSubDistrict = {
  id: "subdistrict-1",
  name: "California Sub-District",
  slug: "california",
};

export const mockEvent = {
  id: "event-1",
  title: "Summer Crusade 2026",
  slug: "summer-crusade-2026",
  description: "Annual summer crusade",
  startDate: "2026-07-15T10:00:00.000Z",
  endDate: "2026-07-15T18:00:00.000Z",
  location: "LA Convention Center",
  address: "1201 S Figueroa St, Los Angeles, CA 90015",
  status: "registration-open",
  registrationEnabled: true,
  registrationDeadline: "2026-07-14T23:59:59.000Z",
  maxAttendees: 500,
  hasBaptism: true,
  checkInEnabled: true,
  organizerChurch: "church-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const mockEventInvite = {
  id: "invite-1",
  inviteCode: "ABCD1234",
  event: { id: "event-1", title: "Summer Crusade 2026" },
  invitedBy: "member-1",
  church: "church-1",
  status: "active",
  memberContactName: "John Member",
  memberContactPhone: "+15551002000",
  memberContactEmail: "john@example.com",
};

export const mockChurchEventInvite = {
  id: "church-invite-1",
  code: "CHURCH01",
  event: { id: "event-1", title: "Summer Crusade 2026", status: "registration-open", hasHeroImage: false },
  church: { id: "church-1", name: "PMCC LA Church", city: "Los Angeles", state: "CA" },
  adPlacement: { id: "placement-1", name: "Bulletin Board", type: "bulletin" },
  status: "active",
  contactName: "Pastor Smith",
  contactEmail: "pastor@example.com",
  contactPhone: "+15551004000",
  scanCount: 0,
};

export const mockPlatformLink = {
  id: "platform-1",
  code: "PLAT0001",
  event: "event-1",
  platform: { id: "platform-meta", name: "Facebook", type: "social" },
  status: "active",
  scanCount: 0,
};

export const mockRegistration = {
  id: "reg-1",
  inviteCode: "REGCODE1",
  event: {
    id: "event-1",
    title: "Summer Crusade 2026",
    startDate: "2026-07-15T10:00:00.000Z",
    location: "LA Convention Center",
    hasBaptism: true,
    checkInEnabled: true,
  },
  eventInvite: "invite-1",
  guest: "guest-1",
  guestInfo: {
    firstName: "Jane",
    lastName: "Guest",
    name: "Jane Guest",
    email: "jane@example.com",
    phone: "+15551003000",
  },
  invitedBy: {
    id: "member-1",
    name: "John Member",
    phone: "+15551002000",
    email: "john@example.com",
    church: { id: "church-1", name: "PMCC LA Church" },
  },
  sourceType: "member",
  status: "registered",
  registeredAt: "2026-06-01T12:00:00.000Z",
};

export const mockAttendedRegistration = {
  ...mockRegistration,
  id: "reg-2",
  inviteCode: "ATNDCODE1",
  status: "attended",
  attendedAt: "2026-07-15T09:30:00.000Z",
};

export const mockBaptizedRegistration = {
  ...mockRegistration,
  id: "reg-3",
  inviteCode: "BPTCODE1",
  status: "baptized",
  attendedAt: "2026-07-15T09:30:00.000Z",
  baptizedAt: "2026-07-15T11:00:00.000Z",
};

export const mockWaitlistedRegistration = {
  ...mockRegistration,
  id: "reg-4",
  inviteCode: "WAITCODE1",
  status: "waitlisted",
  waitlistPosition: 1,
};

export const mockCampaign = {
  id: "campaign-1",
  name: "Reminder Campaign",
  event: "event-1",
  type: "both",
  subject: "See you at {{event}}!",
  smsContent: "Hi {{name}}, see you at {{event}}! {{qrLink}}",
  emailContent: "<p>Hi {{name}}, see you at {{event}}!</p>",
  frequency: "once",
  targetAudience: "all",
  status: "scheduled",
  scheduledAt: "2026-07-10T10:00:00.000Z",
  sentCount: 0,
};
