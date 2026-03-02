/* MODIFIED: Fixed nested HTML tags issue - use PayloadProvider instead of RootLayout */

import type { ServerFunctionClient } from "payload";
import config from "@payload-config";
import { handleServerFunctions, PayloadAdmin, PayloadProvider } from "@payloadcms/next/providers";
import React from "react";

import { importMap } from "./admin/importMap";
import "./custom.scss";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <PayloadProvider config={config} importMap={importMap} serverFunction={serverFunction}>
    <PayloadAdmin>
      {children}
    </PayloadAdmin>
  </PayloadProvider>
);

export default Layout;
