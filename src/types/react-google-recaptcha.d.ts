declare module "react-google-recaptcha" {
  import { Component } from "react";

  interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onErrored?: () => void;
    onExpired?: () => void;
    ref?: React.Ref<ReCAPTCHA>;
    theme?: "light" | "dark";
    size?: "compact" | "normal" | "invisible";
    tabindex?: number;
    type?: "image" | "audio";
    hl?: string;
    badge?: "bottomright" | "bottomleft" | "inline";
  }

  export default class ReCAPTCHA extends Component<ReCAPTCHAProps> {
    reset(): void;
    execute(): Promise<string | null>;
    getValue(): string | null;
    getResponse(): string;
  }
}
