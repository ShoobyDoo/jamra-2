import { Alert, Badge, Button, Card, Group, Loader, Modal, Progress, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconDownload, IconX } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { useInstallExtension, useInstallerJob } from "../../hooks/queries/useInstallerQueries";
import type { InstallJob } from "../../types";

interface InstallerFormValues {
  repositoryUrl: string;
  extensionIds: string;
  branch: string;
}

const getStatusColor = (status: InstallJob["status"]) => {
  switch (status) {
    case "completed":
      return "green";
    case "failed":
      return "red";
    case "pending":
    case "downloading":
    case "compiling":
    case "installing":
      return "blue";
    default:
      return "gray";
  }
};

const getStatusProgress = (status: InstallJob["status"]) => {
  switch (status) {
    case "pending":
      return 10;
    case "downloading":
      return 30;
    case "compiling":
      return 60;
    case "installing":
      return 85;
    case "completed":
      return 100;
    case "failed":
      return 0;
    default:
      return 0;
  }
};

export const InstallerForm: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [activeJobs, setActiveJobs] = useState<InstallJob[]>([]);
  const [pollingJobIds, setPollingJobIds] = useState<string[]>([]);

  const installMutation = useInstallExtension();

  const form = useForm<InstallerFormValues>({
    initialValues: {
      repositoryUrl: "",
      extensionIds: "",
      branch: "",
    },
    validate: {
      repositoryUrl: (value) =>
        value.trim() === "" ? "Repository URL is required" : null,
    },
  });

  const handleSubmit = (values: InstallerFormValues) => {
    const extensionIds = values.extensionIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    installMutation.mutate(
      {
        repositoryUrl: values.repositoryUrl.trim(),
        extensionIds: extensionIds.length > 0 ? extensionIds : undefined,
        branch: values.branch.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          notifications.show({
            title: "Installation Started",
            message: `Queued ${data.jobs.length} extension(s) for installation`,
            color: "blue",
          });

          // Track all jobs
          setActiveJobs(data.jobs);
          setPollingJobIds(data.jobs.map(job => job.jobId));

          // Close form and open progress modal
          form.reset();
          close();
        },
        onError: (error) => {
          notifications.show({
            title: "Installation Failed",
            message: error instanceof Error ? error.message : "Failed to start installation",
            color: "red",
          });
        },
      },
    );
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Install Extension</Title>
            <Text size="sm" c="dimmed">
              Install extensions from a Git repository
            </Text>
          </div>
          <Button leftSection={<IconDownload size={16} />} onClick={open}>
            Install from Repository
          </Button>
        </Group>

        {/* Active Jobs Display */}
        {activeJobs.length > 0 && (
          <Card>
            <Stack gap="md">
              <Title order={4}>Installation Progress</Title>
              {activeJobs.map((job) => (
                <JobProgressCard
                  key={job.jobId}
                  jobId={job.jobId}
                  onComplete={(completedJob) => {
                    setActiveJobs((prev) =>
                      prev.map((j) => (j.jobId === completedJob.jobId ? completedJob : j))
                    );
                  }}
                />
              ))}
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Installation Form Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Title order={3}>Install Extension</Title>}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Repository URL"
              description="Git repository URL (GitHub, GitLab, Bitbucket)"
              placeholder="https://github.com/username/repo"
              required
              {...form.getInputProps("repositoryUrl")}
            />

            <TextInput
              label="Extension IDs (optional)"
              description="Comma-separated extension IDs to install. Leave empty to install all."
              placeholder="extension1, extension2"
              {...form.getInputProps("extensionIds")}
            />

            <TextInput
              label="Branch (optional)"
              description="Git branch to install from. Defaults to main/master."
              placeholder="main"
              {...form.getInputProps("branch")}
            />

            <Alert color="blue">
              The installer will fetch the repository's index.json, validate the extensions, and
              compile them if needed. Check the progress above after submitting.
            </Alert>

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={installMutation.isPending}>
                Start Installation
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

// Sub-component to handle individual job polling
const JobProgressCard: React.FC<{
  jobId: string;
  onComplete: (job: InstallJob) => void;
}> = ({ jobId, onComplete }) => {
  const { data: job, isLoading } = useInstallerJob(jobId, { refetchInterval: 1000 });
  const [notifiedCompletion, setNotifiedCompletion] = useState(false);

  useEffect(() => {
    if (job && (job.status === "completed" || job.status === "failed") && !notifiedCompletion) {
      setNotifiedCompletion(true);
      onComplete(job);

      if (job.status === "completed") {
        notifications.show({
          title: "Installation Complete",
          message: `Extension ${job.extensionId} installed successfully`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        notifications.show({
          title: "Installation Failed",
          message: `Extension ${job.extensionId} failed: ${job.error || "Unknown error"}`,
          color: "red",
          icon: <IconX size={16} />,
        });
      }
    }
  }, [job, notifiedCompletion, onComplete]);

  if (isLoading || !job) {
    return (
      <Card withBorder>
        <Group>
          <Loader size="sm" />
          <Text>Loading job status...</Text>
        </Group>
      </Card>
    );
  }

  const isInProgress = ["pending", "downloading", "compiling", "installing"].includes(job.status);
  const progress = getStatusProgress(job.status);
  const color = getStatusColor(job.status);

  return (
    <Card withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Text fw={500}>{job.extensionId}</Text>
            <Text size="sm" c="dimmed">
              {job.repositoryUrl}
            </Text>
          </div>
          <Badge color={color} variant={isInProgress ? "light" : "filled"}>
            {job.status}
          </Badge>
        </Group>

        {isInProgress && (
          <Progress value={progress} color={color} size="sm" animated />
        )}

        {job.error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            <Text size="sm">{job.error}</Text>
          </Alert>
        )}

        <Group gap="xs">
          <Text size="xs" c="dimmed">
            Started: {new Date(job.requestedAt).toLocaleString()}
          </Text>
          {job.completedAt && (
            <Text size="xs" c="dimmed">
              • Completed: {new Date(job.completedAt).toLocaleString()}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
};
