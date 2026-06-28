import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";

export interface IAgentProfileRepository {
  load(): unknown | null;
  save(profiles: AgentProfile[]): void;
}
