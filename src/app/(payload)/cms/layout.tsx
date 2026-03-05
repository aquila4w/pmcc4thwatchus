import type { ServerFunctionClient } from "payload";
import config from "@payload-config";
import { RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "../admin/importMap";
import "../custom.scss";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  const { handleServerFunctions } = await import("@payloadcms/next/layouts");
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const CMSLayout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction} htmlProps={{ suppressHydrationWarning: true }}>
    {children}
  </RootLayout>
);

export default CMSLayout;
