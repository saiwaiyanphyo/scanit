"use client";

import type { PayloadKind, PayloadState } from "@/lib/payload";
import { PAYLOAD_LABELS } from "@/lib/payload";
import { Labeled, Segmented, TextArea, TextField, Toggle } from "./ui";

const KINDS: PayloadKind[] = ["url", "text", "wifi", "vcard", "email", "sms", "phone", "geo"];

export function PayloadForm({
  value,
  onChange,
}: {
  value: PayloadState;
  onChange: (next: PayloadState) => void;
}) {
  const set = <K extends keyof PayloadState>(key: K, v: PayloadState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3">
      <Segmented
        value={value.kind}
        columns={4}
        options={KINDS.map((k) => ({ value: k, label: PAYLOAD_LABELS[k] }))}
        onChange={(k) => set("kind", k)}
      />

      {value.kind === "url" && (
        <TextField
          label="Destination URL"
          value={value.url}
          placeholder="https://example.com"
          onChange={(v) => set("url", v)}
        />
      )}

      {value.kind === "text" && (
        <TextArea
          label="Text"
          value={value.text}
          placeholder="Anything you want encoded…"
          onChange={(v) => set("text", v)}
        />
      )}

      {value.kind === "wifi" && (
        <>
          <TextField
            label="Network name (SSID)"
            value={value.wifi.ssid}
            placeholder="MyNetwork"
            onChange={(v) => set("wifi", { ...value.wifi, ssid: v })}
          />
          <Segmented
            label="Security"
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
              value={value.wifi.password}
              onChange={(v) => set("wifi", { ...value.wifi, password: v })}
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
              onChange={(v) => set("vcard", { ...value.vcard, firstName: v })}
            />
            <TextField
              label="Last name"
              value={value.vcard.lastName}
              onChange={(v) => set("vcard", { ...value.vcard, lastName: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Organisation"
              value={value.vcard.org}
              onChange={(v) => set("vcard", { ...value.vcard, org: v })}
            />
            <TextField
              label="Job title"
              value={value.vcard.title}
              onChange={(v) => set("vcard", { ...value.vcard, title: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Phone"
              value={value.vcard.phone}
              type="tel"
              onChange={(v) => set("vcard", { ...value.vcard, phone: v })}
            />
            <TextField
              label="Email"
              value={value.vcard.email}
              type="email"
              onChange={(v) => set("vcard", { ...value.vcard, email: v })}
            />
          </div>
          <TextField
            label="Website"
            value={value.vcard.website}
            onChange={(v) => set("vcard", { ...value.vcard, website: v })}
          />
          <TextField
            label="Address"
            value={value.vcard.address}
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
            placeholder="hello@example.com"
            onChange={(v) => set("email", { ...value.email, to: v })}
          />
          <TextField
            label="Subject"
            value={value.email.subject}
            onChange={(v) => set("email", { ...value.email, subject: v })}
          />
          <TextArea
            label="Body"
            rows={3}
            value={value.email.body}
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
            placeholder="+1 555 000 1234"
            onChange={(v) => set("sms", { ...value.sms, number: v })}
          />
          <TextArea
            label="Message"
            rows={3}
            value={value.sms.message}
            onChange={(v) => set("sms", { ...value.sms, message: v })}
          />
        </>
      )}

      {value.kind === "phone" && (
        <TextField
          label="Phone number"
          type="tel"
          value={value.phone}
          placeholder="+1 555 000 1234"
          onChange={(v) => set("phone", v)}
        />
      )}

      {value.kind === "geo" && (
        <Labeled label="Coordinates">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="field"
              placeholder="Latitude"
              value={value.geo.lat}
              onChange={(e) => set("geo", { ...value.geo, lat: e.target.value })}
            />
            <input
              className="field"
              placeholder="Longitude"
              value={value.geo.lng}
              onChange={(e) => set("geo", { ...value.geo, lng: e.target.value })}
            />
          </div>
        </Labeled>
      )}
    </div>
  );
}
