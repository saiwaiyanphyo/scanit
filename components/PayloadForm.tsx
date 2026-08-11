"use client";

import { useState } from "react";
import type { PayloadKind, PayloadState } from "@/lib/payload";
import { PAYLOAD_LABELS } from "@/lib/payload";
import { Eye, EyeOff, Link, Phone } from "./Icons";
import { Label, PillGroup, SolidPillGroup, TextArea, TextField, Toggle } from "./ui";

const KINDS: PayloadKind[] = ["url", "text", "wifi", "vcard", "email", "sms", "phone", "geo"];

const HELP: Partial<Record<PayloadKind, string>> = {
  url: "Opens this address when scanned. Include https:// so every scanner treats it as a link.",
  wifi: "Scanning offers to join the network — no typing the password on a phone keyboard.",
  vcard: "Scanning offers to save these details straight to the phone's contacts.",
};

export function PayloadForm({
  value,
  onChange,
}: {
  value: PayloadState;
  onChange: (next: PayloadState) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const set = <K extends keyof PayloadState>(key: K, v: PayloadState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div>
        <Label help="What happens when someone scans the code.">Type</Label>
        <SolidPillGroup
          value={value.kind}
          columns={4}
          options={KINDS.map((k) => ({ value: k, label: PAYLOAD_LABELS[k] }))}
          onChange={(k) => set("kind", k)}
        />
      </div>

      {value.kind === "url" && (
        <TextField
          label="Destination URL"
          help={HELP.url}
          icon={<Link className="h-4 w-4" />}
          value={value.url}
          placeholder="https://example.com"
          onChange={(v) => set("url", v)}
        />
      )}

      {value.kind === "text" && (
        <TextArea
          label="Content"
          value={value.text}
          placeholder="Enter your text here…"
          onChange={(v) => set("text", v)}
        />
      )}

      {value.kind === "wifi" && (
        <>
          <TextField
            label="Network name (SSID)"
            help={HELP.wifi}
            value={value.wifi.ssid}
            placeholder="MyNetwork"
            onChange={(v) => set("wifi", { ...value.wifi, ssid: v })}
          />
          <PillGroup
            label="Security"
            columns={3}
            value={value.wifi.encryption}
            options={[
              { value: "WPA", label: "WPA/WPA2" },
              { value: "WEP", label: "WEP" },
              { value: "nopass", label: "None" },
            ]}
            onChange={(v) => set("wifi", { ...value.wifi, encryption: v })}
          />
          {value.wifi.encryption !== "nopass" && (
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={value.wifi.password}
              onChange={(v) => set("wifi", { ...value.wifi, password: v })}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="focusable rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              }
            />
          )}
          <Toggle
            label="Hidden network"
            checked={value.wifi.hidden}
            onChange={(v) => set("wifi", { ...value.wifi, hidden: v })}
          />
        </>
      )}

      {value.kind === "vcard" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="First name"
              value={value.vcard.firstName}
              placeholder="Jane"
              onChange={(v) => set("vcard", { ...value.vcard, firstName: v })}
            />
            <TextField
              label="Last name"
              value={value.vcard.lastName}
              placeholder="Doe"
              onChange={(v) => set("vcard", { ...value.vcard, lastName: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Organisation"
              value={value.vcard.org}
              placeholder="Acme Inc."
              onChange={(v) => set("vcard", { ...value.vcard, org: v })}
            />
            <TextField
              label="Job title"
              value={value.vcard.title}
              placeholder="Engineer"
              onChange={(v) => set("vcard", { ...value.vcard, title: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Phone"
              type="tel"
              value={value.vcard.phone}
              placeholder="+1 555 0123"
              onChange={(v) => set("vcard", { ...value.vcard, phone: v })}
            />
            <TextField
              label="Email"
              type="email"
              value={value.vcard.email}
              placeholder="jane@example.com"
              onChange={(v) => set("vcard", { ...value.vcard, email: v })}
            />
          </div>
          <TextField
            label="Website"
            value={value.vcard.website}
            placeholder="https://example.com"
            onChange={(v) => set("vcard", { ...value.vcard, website: v })}
          />
          <TextField
            label="Address"
            value={value.vcard.address}
            placeholder="1 Market St, San Francisco"
            onChange={(v) => set("vcard", { ...value.vcard, address: v })}
          />
        </>
      )}

      {value.kind === "email" && (
        <>
          <TextField
            label="To"
            type="email"
            value={value.email.to}
            placeholder="recipient@example.com"
            onChange={(v) => set("email", { ...value.email, to: v })}
          />
          <TextField
            label="Subject"
            value={value.email.subject}
            placeholder="Meeting tomorrow"
            onChange={(v) => set("email", { ...value.email, subject: v })}
          />
          <TextArea
            label="Body"
            rows={3}
            value={value.email.body}
            placeholder="Hi, just a reminder about…"
            onChange={(v) => set("email", { ...value.email, body: v })}
          />
        </>
      )}

      {value.kind === "sms" && (
        <>
          <TextField
            label="Number"
            type="tel"
            value={value.sms.number}
            placeholder="+1 555 0123"
            onChange={(v) => set("sms", { ...value.sms, number: v })}
          />
          <TextArea
            label="Message"
            rows={3}
            value={value.sms.message}
            placeholder="Hey, check this out!"
            onChange={(v) => set("sms", { ...value.sms, message: v })}
          />
        </>
      )}

      {value.kind === "phone" && (
        <TextField
          label="Phone number"
          type="tel"
          icon={<Phone className="h-4 w-4" />}
          value={value.phone}
          placeholder="+1 555 0123"
          onChange={(v) => set("phone", v)}
        />
      )}

      {value.kind === "geo" && (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Latitude"
            value={value.geo.lat}
            placeholder="37.7749"
            onChange={(v) => set("geo", { ...value.geo, lat: v })}
          />
          <TextField
            label="Longitude"
            value={value.geo.lng}
            placeholder="-122.4194"
            onChange={(v) => set("geo", { ...value.geo, lng: v })}
          />
        </div>
      )}
    </div>
  );
}
