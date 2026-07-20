/**
 * Thin wrapper over the Web MIDI API for streaming notes to an external device
 * or DAW (via a virtual MIDI bus). Everything degrades gracefully: if the
 * browser has no Web MIDI support, `isSupported()` is false and the UI hides
 * the picker entirely.
 */
export interface MidiOutputInfo {
  id: string;
  name: string;
}

// Minimal structural types so we don't depend on lib.dom's WebMIDI typings.
interface MidiPort {
  id: string;
  name: string | null;
  send(data: number[]): void;
}
interface MidiAccessLike {
  outputs: Map<string, MidiPort>;
}

export class WebMidiOut {
  private access: MidiAccessLike | null = null;
  private output: MidiPort | null = null;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
  }

  /** Request access (prompts the user once) and return the available outputs. */
  async init(): Promise<MidiOutputInfo[]> {
    if (!WebMidiOut.isSupported()) return [];
    const nav = navigator as unknown as {
      requestMIDIAccess: (opts?: { sysex: boolean }) => Promise<MidiAccessLike>;
    };
    this.access = await nav.requestMIDIAccess({ sysex: false });
    return this.listOutputs();
  }

  listOutputs(): MidiOutputInfo[] {
    if (!this.access) return [];
    return [...this.access.outputs.values()].map((o) => ({
      id: o.id,
      name: o.name ?? "MIDI output",
    }));
  }

  /** Route to a device by id, or pass null to disable output. */
  select(id: string | null): void {
    if (this.output) this.allOff();
    this.output = id && this.access ? (this.access.outputs.get(id) ?? null) : null;
  }

  get enabled(): boolean {
    return this.output !== null;
  }

  noteOn(midi: number, velocity = 0.8, channel = 0): void {
    this.output?.send([0x90 | (channel & 0x0f), midi & 0x7f, Math.round(velocity * 127) & 0x7f]);
  }

  noteOff(midi: number, channel = 0): void {
    this.output?.send([0x80 | (channel & 0x0f), midi & 0x7f, 0]);
  }

  /** Panic: silence every note on every channel. */
  allOff(): void {
    if (!this.output) return;
    for (let ch = 0; ch < 16; ch++) {
      this.output.send([0xb0 | ch, 123, 0]); // All Notes Off
    }
  }
}
