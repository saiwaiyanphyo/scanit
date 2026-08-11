export type PayloadKind = "url" | "text" | "wifi" | "vcard" | "email" | "sms" | "phone" | "geo";

export interface PayloadState {
  kind: PayloadKind;
  url: string;
  text: string;
  wifi: { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden: boolean };
  vcard: {
    firstName: string;
    lastName: string;
    org: string;
    title: string;
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  email: { to: string; subject: string; body: string };
  sms: { number: string; message: string };
  phone: string;
  geo: { lat: string; lng: string };
}

export const emptyPayload: PayloadState = {
  kind: "url",
  url: "https://vercel.com",
  text: "",
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  vcard: {
    firstName: "",
    lastName: "",
    org: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    address: "",
  },
  email: { to: "", subject: "", body: "" },
  sms: { number: "", message: "" },
  phone: "",
  geo: { lat: "", lng: "" },
};

/** WIFI: and MECARD-style formats escape these with a backslash. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCard(value: string): string {
  return value.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");
}

export function encodePayload(p: PayloadState): string {
  switch (p.kind) {
    case "url":
      return p.url.trim();

    case "text":
      return p.text;

    case "wifi": {
      const { ssid, password, encryption, hidden } = p.wifi;
      if (!ssid.trim()) return "";
      const parts = [`T:${encryption}`, `S:${escapeWifi(ssid)}`];
      if (encryption !== "nopass") parts.push(`P:${escapeWifi(password)}`);
      if (hidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }

    case "vcard": {
      const v = p.vcard;
      if (!v.firstName.trim() && !v.lastName.trim() && !v.org.trim()) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escapeVCard(v.lastName)};${escapeVCard(v.firstName)};;;`,
        `FN:${escapeVCard(`${v.firstName} ${v.lastName}`.trim())}`,
      ];
      if (v.org) lines.push(`ORG:${escapeVCard(v.org)}`);
      if (v.title) lines.push(`TITLE:${escapeVCard(v.title)}`);
      if (v.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(v.phone)}`);
      if (v.email) lines.push(`EMAIL:${escapeVCard(v.email)}`);
      if (v.website) lines.push(`URL:${escapeVCard(v.website)}`);
      if (v.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(v.address)};;;;`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }

    case "email": {
      const { to, subject, body } = p.email;
      if (!to.trim()) return "";
      const q = new URLSearchParams();
      if (subject) q.set("subject", subject);
      if (body) q.set("body", body);
      const qs = q.toString();
      return `mailto:${to.trim()}${qs ? `?${qs}` : ""}`;
    }

    case "sms": {
      const { number, message } = p.sms;
      if (!number.trim()) return "";
      return `SMSTO:${number.trim()}:${message}`;
    }

    case "phone":
      return p.phone.trim() ? `tel:${p.phone.trim()}` : "";

    case "geo": {
      const { lat, lng } = p.geo;
      if (!lat.trim() || !lng.trim()) return "";
      return `geo:${lat.trim()},${lng.trim()}`;
    }
  }
}

export const PAYLOAD_LABELS: Record<PayloadKind, string> = {
  url: "Link",
  text: "Text",
  wifi: "Wi-Fi",
  vcard: "Contact",
  email: "Email",
  sms: "SMS",
  phone: "Phone",
  geo: "Location",
};
