import type { IAgentProfileRepository } from "@/application/ports/IAgentProfileRepository";
import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";

const STORAGE_KEY = "pixelart.aiTextField.agentProfiles";
const VERSION = 1;

interface SerializedAgentProfiles {
  version: number;
  profiles: AgentProfile[];
}

export class LocalAgentProfileRepository implements IAgentProfileRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedAgentProfiles).version;
      if (version !== VERSION) {
        return null;
      }

      return (parsed as SerializedAgentProfiles).profiles;
    } catch {
      return null;
    }
  }

  save(profiles: AgentProfile[]): void {
    try {
      const payload: SerializedAgentProfiles = {
        version: VERSION,
        profiles,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }
  }
}

export const agentProfileRepository = new LocalAgentProfileRepository();
