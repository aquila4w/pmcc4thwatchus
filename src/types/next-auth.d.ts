import "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      inviteCode: string;
      forcePasswordChange: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    status?: string;
    inviteCode?: string;
    payloadToken?: string;
    forcePasswordChange?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    status: string;
    inviteCode: string;
    payloadToken?: string;
    forcePasswordChange: boolean;
  }
}
