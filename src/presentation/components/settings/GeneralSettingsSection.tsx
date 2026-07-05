import {
  MAX_AUTO_SAVE_INTERVAL_MINUTES,
  MIN_AUTO_SAVE_INTERVAL_MINUTES,
} from "@/domain/appSettings/AppSettings";
import { useAppStore } from "../../stores/appStore";
import {
  SettingsGroup,
  SettingsNumberInput,
  SettingsPathField,
  SettingsRow,
  SettingsToggle,
} from "./SettingsField";

export function GeneralSettingsSection() {
  const softwareDataPath = useAppStore((s) => s.softwareDataPath);
  const pickSoftwareDataPath = useAppStore((s) => s.pickSoftwareDataPath);
  const autoSaveIntervalMinutes = useAppStore((s) => s.appSettings.autoSaveIntervalMinutes);
  const pomodoroVisible = useAppStore((s) => s.appSettings.pomodoroVisible);
  const setAutoSaveIntervalMinutes = useAppStore((s) => s.setAutoSaveIntervalMinutes);
  const setPomodoroVisible = useAppStore((s) => s.setPomodoroVisible);

  return (
    <div className="flex flex-col gap-5">
      <SettingsGroup
        title="软件数据路径"
        description="所有项目将默认保存到该目录，资产库保存在该目录下的 .pixelart-assets 中。"
      >
        <SettingsPathField
          path={softwareDataPath}
          emptyLabel="首次使用请选择软件数据路径，所有项目将默认保存到该目录。"
          buttonLabel="选择软件数据路径"
          onPick={() => void pickSoftwareDataPath()}
        />
      </SettingsGroup>

      <SettingsGroup title="自动保存" description="按设定间隔将当前项目自动保存到恢复目录，避免意外丢失。">
        <SettingsRow
          label="保存间隔"
          hint={`${MIN_AUTO_SAVE_INTERVAL_MINUTES}–${MAX_AUTO_SAVE_INTERVAL_MINUTES} 分钟`}
        >
          <SettingsNumberInput
            value={autoSaveIntervalMinutes}
            min={MIN_AUTO_SAVE_INTERVAL_MINUTES}
            max={MAX_AUTO_SAVE_INTERVAL_MINUTES}
            suffix="分钟"
            onChange={setAutoSaveIntervalMinutes}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="界面">
        <SettingsToggle
          label="显示底部番茄倒计时"
          hint="在状态栏右侧显示番茄钟控件"
          checked={pomodoroVisible}
          onChange={setPomodoroVisible}
        />
      </SettingsGroup>
    </div>
  );
}
