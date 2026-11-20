import { useState } from "react";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "../lib/settings.ts";
import type { Settings } from "../lib/types.ts";
import { Button } from "./ui/button.tsx";
import { Field, Input } from "./ui/input.tsx";
import { Modal } from "./ui/modal.tsx";

export function SettingsDialog({
  open,
  settings,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  settings: Settings;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: Settings) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      description="The key stays in this browser. Requests go straight to api.x.ai."
    >
      {open ? (
        <SettingsForm
          settings={settings}
          onSave={(next) => {
            onSave(next);
            onOpenChange(false);
          }}
        />
      ) : null}
    </Modal>
  );
}

function SettingsForm({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [showKey, setShowKey] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          apiKey: draft.apiKey.trim(),
          model: draft.model.trim() || DEFAULT_MODEL,
          baseUrl: draft.baseUrl.trim() || DEFAULT_BASE_URL,
        });
      }}
    >
      <Field label="xAI API key" hint="Stored in localStorage on this device. Not written into the app bundle.">
        <div className="flex gap-2">
          <Input
            type={showKey ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={draft.apiKey}
            placeholder="xai-..."
            onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
          />
          <Button type="button" variant="outline" className="shrink-0" onClick={() => setShowKey((value) => !value)}>
            {showKey ? "Hide" : "Show"}
          </Button>
        </div>
      </Field>
      <Field label="Model" hint="Default is grok-4. Use a vision-capable model.">
        <Input
          value={draft.model}
          spellCheck={false}
          onChange={(event) => setDraft({ ...draft, model: event.target.value })}
        />
      </Field>
      <Field label="API base URL" hint="Leave this unless you are pointing at your own proxy.">
        <Input
          value={draft.baseUrl}
          spellCheck={false}
          onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
        />
      </Field>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="danger" onClick={() => setDraft({ ...draft, apiKey: "" })}>
          Clear key
        </Button>
      </div>
    </form>
  );
}
