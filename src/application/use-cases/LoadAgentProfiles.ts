import { parseAgentProfile, BUILT_IN_AGENT_PROFILES, type AgentProfile } from "@/domain/aiTextField/AgentProfile";
import type { IAgentProfileRepository } from "../ports/IAgentProfileRepository";

export async function loadAgentProfiles(
  repository: IAgentProfileRepository,
  softwareDataPath: string,
): Promise<AgentProfile[]> {
  const raw = await repository.load(softwareDataPath);
  if (!Array.isArray(raw)) {
    return [...BUILT_IN_AGENT_PROFILES];
  }

  const loaded = raw.map((item) => parseAgentProfile(item));

  const result = [...loaded];
  for (const builtin of BUILT_IN_AGENT_PROFILES) {
    if (!result.some((p) => p.id === builtin.id)) {
      result.push(builtin);
    }
  }

  return result;
}
