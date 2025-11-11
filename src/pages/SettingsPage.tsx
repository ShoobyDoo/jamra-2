import { Alert, Card, Stack, Switch, Text, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type {
  PreferenceKey,
  PreferenceValueMap,
} from "../types/electron-api";

const CLOSE_TO_TRAY_KEY: PreferenceKey = "closeButtonMinimizesToTray";
const DEFAULT_BEHAVIOR: PreferenceValueMap[typeof CLOSE_TO_TRAY_KEY] = true;

export const SettingsPage = () => {
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
        Manage desktop window behavior and upcoming preferences.
      </Text>

      <Stack gap="lg">
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
      </Stack>
    </div>
  );
};
