import { useComfyUiStore } from "../../stores/comfyUiStore";
import { SettingsGroup, SettingsRow, SettingsTextInput } from "./SettingsField";

export function ComfyUiSettingsSection() {
  const serverConfig = useComfyUiStore((s) => s.serverConfig);
  const setServerAddress = useComfyUiStore((s) => s.setServerAddress);

  return (
    <div className="flex flex-col gap-5">
      <SettingsGroup
        title="服务器"
        description={'连接你自行启动的 ComfyUI 进程。需以 --enable-cors-header "*" 方式启动以允许跨域访问。'}
      >
        <SettingsRow
          label="服务器地址"
          hint="形如 127.0.0.1:8188，可带 http(s):// 前缀；远程访问时填对应 IP:端口"
        >
          <SettingsTextInput
            value={serverConfig.address}
            onChange={setServerAddress}
            placeholder="127.0.0.1:8188"
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
