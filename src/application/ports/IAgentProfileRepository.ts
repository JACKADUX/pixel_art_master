import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";

export interface IAgentProfileRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, profiles: AgentProfile[]): Promise<void>;
}
