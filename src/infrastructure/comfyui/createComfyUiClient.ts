import type { IComfyUiClient } from "@/application/ports/IComfyUiClient";
import { HttpComfyUiClient } from "./HttpComfyUiClient";

export const comfyUiClient: IComfyUiClient = new HttpComfyUiClient();
