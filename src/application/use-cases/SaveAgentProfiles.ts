import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";
import type { IAgentProfileRepository } from "../ports/IAgentProfileRepository";

export function saveAgentProfiles(repository: IAgentProfileRepository, profiles: AgentProfile[]): void {
  repository.save(profiles);
}
