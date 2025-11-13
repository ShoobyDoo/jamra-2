import {
  Alert,
  Card,
  Divider,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import React, { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  DEFAULT_SETTINGS,
  DOWNLOAD_QUALITY_OPTIONS,
  PAGE_FIT_OPTIONS,
  PAGE_TURN_MODE_OPTIONS,
  READING_DIRECTION_OPTIONS,
  SETTING_KEYS,
  THEME_OPTIONS,
  getScopeFromKey,
} from "../constants";
import {
  useSetting,
  useUpdateSetting,
} from "../hooks/queries/useSettingsQueries";
import type {
  PreferenceKey,
  PreferenceValueMap,
} from "../types/electron-api";

const CLOSE_TO_TRAY_KEY: PreferenceKey = "closeButtonMinimizesToTray";
const DEFAULT_BEHAVIOR: PreferenceValueMap[typeof CLOSE_TO_TRAY_KEY] = true;

export const SettingsPage: React.FC = () => {
  const isElectron = useMemo(
    () => typeof window !== "undefined" && Boolean(window.electron),
    [],
  );
  const preferenceAPI =
    typeof window === "undefined" ? undefined : window.electron?.preferences;
  const [closeToTray, setCloseToTray] = useState(DEFAULT_BEHAVIOR);
  const [isLoading, setIsLoading] = useState(isElectron);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectron || !preferenceAPI) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    preferenceAPI
      .get(CLOSE_TO_TRAY_KEY)
      .then((value) => {
        if (!mounted) return;
        setCloseToTray(value);
        setErrorMessage(null);
      })
      .catch((error) => {
        console.error("Failed to load close-to-tray preference", error);
        if (!mounted) return;
        setErrorMessage("Unable to load desktop preference.");
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const unsubscribe = preferenceAPI.subscribe(
      CLOSE_TO_TRAY_KEY,
      (value) => mounted && setCloseToTray(value),
    );

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [isElectron, preferenceAPI]);

  const handleToggle = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!preferenceAPI) return;
    const nextValue = event.currentTarget.checked;
    const previousValue = closeToTray;
    setIsSaving(true);
    setErrorMessage(null);
    setCloseToTray(nextValue);

    try {
      await preferenceAPI.set(CLOSE_TO_TRAY_KEY, nextValue);
    } catch (error) {
      console.error("Failed to update close-to-tray preference", error);
      setCloseToTray(previousValue);
      setErrorMessage("Saving failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderDesktopSetting = () => {
    if (!isElectron) {
      return (
        <Alert
          color="gray"
          radius="md"
          variant="light"
          icon={<IconInfoCircle size={18} />}
        >
          Desktop-only preference. Launch JAMRA via the Electron app to adjust
          tray behavior.
        </Alert>
      );
    }

    return (
      <Stack gap="xs">
        <Switch
          label="Close button minimizes to tray"
          description="Hide JAMRA when you click the close button. The app keeps running in the background so the server and tray controls stay available."
          checked={closeToTray}
          disabled={isLoading || isSaving}
          onChange={handleToggle}
        />
        {isLoading && (
          <Text size="sm" c="dimmed">
            Loading preference from the desktop app…
          </Text>
        )}
        {errorMessage && (
          <Text size="sm" c="red.6">
            {errorMessage}
          </Text>
        )}
      </Stack>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-2">
        Settings
      </Title>
      <Text c="dimmed" className="mb-6">
        Manage application preferences and behavior.
      </Text>

      <Stack gap="lg">
        {/* Window Behavior (Electron only) */}
        <Card withBorder padding="xl" radius="lg">
          <Stack gap="md">
            <div>
              <Text fw={600}>Window Behavior</Text>
              <Text size="sm" c="dimmed">
                Control how JAMRA handles the close button while the web server
                keeps running.
              </Text>
            </div>
            {renderDesktopSetting()}
          </Stack>
        </Card>

        {/* Appearance Settings */}
        <Card withBorder padding="xl" radius="lg">
          <Stack gap="md">
            <div>
              <Text fw={600}>Appearance</Text>
              <Text size="sm" c="dimmed">
                Customize the look and feel of the application.
              </Text>
            </div>
            <SettingSelect
              settingKey={SETTING_KEYS.APP.THEME}
              label="Theme"
              description="Choose your preferred color theme"
              data={THEME_OPTIONS}
            />
          </Stack>
        </Card>

        {/* Reader Preferences */}
        <Card withBorder padding="xl" radius="lg">
          <Stack gap="md">
            <div>
              <Text fw={600}>Reader Preferences</Text>
              <Text size="sm" c="dimmed">
                Configure how manga pages are displayed and navigated.
              </Text>
            </div>
            <SettingSelect
              settingKey={SETTING_KEYS.READER.PAGE_FIT}
              label="Page Fit"
              description="How pages should fit on your screen"
              data={PAGE_FIT_OPTIONS}
            />
            <Divider />
            <SettingSelect
              settingKey={SETTING_KEYS.READER.READING_DIRECTION}
              label="Reading Direction"
              description="Direction for navigating pages"
              data={READING_DIRECTION_OPTIONS}
            />
            <Divider />
            <SettingSelect
              settingKey={SETTING_KEYS.READER.PAGE_TURN_MODE}
              label="Page Turn Mode"
              description="How to advance to the next page"
              data={PAGE_TURN_MODE_OPTIONS}
            />
            <Divider />
            <SettingSwitch
              settingKey={SETTING_KEYS.READER.SHOW_PAGE_NUMBERS}
              label="Show Page Numbers"
              description="Display current page number while reading"
            />
          </Stack>
        </Card>

        {/* Download Preferences */}
        <Card withBorder padding="xl" radius="lg">
          <Stack gap="md">
            <div>
              <Text fw={600}>Download Preferences</Text>
              <Text size="sm" c="dimmed">
                Control download quality and behavior.
              </Text>
            </div>
            <SettingSelect
              settingKey={SETTING_KEYS.DOWNLOADS.QUALITY}
              label="Download Quality"
              description="Image quality for downloaded chapters"
              data={DOWNLOAD_QUALITY_OPTIONS}
            />
            <Divider />
            <SettingNumber
              settingKey={SETTING_KEYS.DOWNLOADS.CONCURRENT_LIMIT}
              label="Concurrent Downloads"
              description="Maximum number of simultaneous downloads"
              min={1}
              max={10}
            />
            <Divider />
            <SettingSwitch
              settingKey={SETTING_KEYS.DOWNLOADS.AUTO_DELETE_AFTER_READ}
              label="Auto-delete After Reading"
              description="Automatically remove downloaded chapters after reading"
            />
          </Stack>
        </Card>

        {/* Catalog Settings */}
        <Card withBorder padding="xl" radius="lg">
          <Stack gap="md">
            <div>
              <Text fw={600}>Catalog Settings</Text>
              <Text size="sm" c="dimmed">
                Manage extension catalog synchronization.
              </Text>
            </div>
            <SettingSwitch
              settingKey={SETTING_KEYS.CATALOG.AUTO_SYNC}
              label="Auto-sync Catalog"
              description="Automatically sync extension catalogs on startup"
            />
            <Divider />
            <SettingNumber
              settingKey={SETTING_KEYS.CATALOG.SYNC_INTERVAL}
              label="Sync Interval (hours)"
              description="How often to check for catalog updates"
              min={1}
              max={168}
            />
          </Stack>
        </Card>
      </Stack>
    </div>
  );
};

/**
 * Select input for a setting
 */
interface SettingSelectProps {
  settingKey: string;
  label: string;
  description: string;
  data: readonly { value: string; label: string }[];
}

const SettingSelect: React.FC<SettingSelectProps> = ({
  settingKey,
  label,
  description,
  data,
}) => {
  const defaultValue = DEFAULT_SETTINGS[
    settingKey as keyof typeof DEFAULT_SETTINGS
  ] as string;
  const { data: setting, isLoading } = useSetting<string>(settingKey);
  const updateSetting = useUpdateSetting();

  const value = setting?.value ?? defaultValue;

  const handleChange = (newValue: string | null) => {
    if (!newValue) return;

    updateSetting.mutate(
      {
        key: settingKey,
        value: newValue,
        scope: getScopeFromKey(settingKey),
      },
      {
        onSuccess: () => {
          notifications.show({
            title: "Setting Updated",
            message: `${label} has been updated`,
            color: "green",
          });
        },
        onError: (error) => {
          notifications.show({
            title: "Update Failed",
            message: error.message || "Failed to update setting",
            color: "red",
          });
        },
      },
    );
  };

  return (
    <Select
      label={label}
      description={description}
      data={[...data]}
      value={value}
      onChange={handleChange}
      disabled={isLoading || updateSetting.isPending}
    />
  );
};

/**
 * Switch input for a boolean setting
 */
interface SettingSwitchProps {
  settingKey: string;
  label: string;
  description: string;
}

const SettingSwitch: React.FC<SettingSwitchProps> = ({
  settingKey,
  label,
  description,
}) => {
  const defaultValue = DEFAULT_SETTINGS[
    settingKey as keyof typeof DEFAULT_SETTINGS
  ] as boolean;
  const { data: setting, isLoading } = useSetting<boolean>(settingKey);
  const updateSetting = useUpdateSetting();

  const checked = setting?.value ?? defaultValue;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.currentTarget.checked;

    updateSetting.mutate(
      {
        key: settingKey,
        value: newValue,
        scope: getScopeFromKey(settingKey),
      },
      {
        onSuccess: () => {
          notifications.show({
            title: "Setting Updated",
            message: `${label} has been updated`,
            color: "green",
          });
        },
        onError: (error) => {
          notifications.show({
            title: "Update Failed",
            message: error.message || "Failed to update setting",
            color: "red",
          });
        },
      },
    );
  };

  return (
    <Switch
      label={label}
      description={description}
      checked={checked}
      onChange={handleChange}
      disabled={isLoading || updateSetting.isPending}
    />
  );
};

/**
 * Number input for a numeric setting
 */
interface SettingNumberProps {
  settingKey: string;
  label: string;
  description: string;
  min: number;
  max: number;
}

const SettingNumber: React.FC<SettingNumberProps> = ({
  settingKey,
  label,
  description,
  min,
  max,
}) => {
  const defaultValue = DEFAULT_SETTINGS[
    settingKey as keyof typeof DEFAULT_SETTINGS
  ] as number;
  const { data: setting, isLoading } = useSetting<number>(settingKey);
  const updateSetting = useUpdateSetting();

  const value = setting?.value ?? defaultValue;

  const handleChange = (newValue: string | number) => {
    const numValue = typeof newValue === "string" ? parseInt(newValue) : newValue;
    if (isNaN(numValue)) return;

    updateSetting.mutate(
      {
        key: settingKey,
        value: numValue,
        scope: getScopeFromKey(settingKey),
      },
      {
        onSuccess: () => {
          notifications.show({
            title: "Setting Updated",
            message: `${label} has been updated`,
            color: "green",
          });
        },
        onError: (error) => {
          notifications.show({
            title: "Update Failed",
            message: error.message || "Failed to update setting",
            color: "red",
          });
        },
      },
    );
  };

  return (
    <NumberInput
      label={label}
      description={description}
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      disabled={isLoading || updateSetting.isPending}
    />
  );
};
