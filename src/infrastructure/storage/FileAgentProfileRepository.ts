import type { IAgentProfileRepository } from "@/application/ports/IAgentProfileRepository";
import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";
import { buildAgentProfilesPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

const VERSION = 1;

interface SerializedAgentProfiles {
  version: number;
  profiles: AgentProfile[];
}

export class FileAgentProfileRepository implements IAgentProfileRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildAgentProfilesPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedAgentProfiles).version;
    if (version !== VERSION) {
      return null;
    }

    return (parsed as SerializedAgentProfiles).profiles;
  }

  async save(softwareDataPath: string, profiles: AgentProfile[]): Promise<void> {
    const payload: SerializedAgentProfiles = {
      version: VERSION,
      profiles,
    };
    await writeUserDataJson(softwareDataPath, buildAgentProfilesPath(softwareDataPath), payload);
  }
}

export const agentProfileRepository = new FileAgentProfileRepository();
