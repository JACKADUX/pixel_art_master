import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";
import type { IAgentProfileRepository } from "../ports/IAgentProfileRepository";

export async function saveAgentProfiles(
  repository: IAgentProfileRepository,
  softwareDataPath: string,
  profiles: AgentProfile[],
): Promise<void> {
  await repository.save(softwareDataPath, profiles);
}
