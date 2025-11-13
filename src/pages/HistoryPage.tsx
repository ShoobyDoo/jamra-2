import React, { useState } from "react";
import { Container, Title, SegmentedControl, Stack } from "@mantine/core";
import { IconBook, IconList } from "@tabler/icons-react";
import { ReadingActivityView } from "../components/history/ReadingActivityView";
import { AuditLogView } from "../components/history/AuditLogView";

type ViewMode = "reading" | "audit";

export const HistoryPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("reading");

  return (
    <Container size="lg" className="py-6">
      <Stack gap="lg">
        <div className="flex items-center justify-between">
          <Title order={1}>History</Title>

          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            data={[
              {
                value: "reading",
                label: (
                  <div className="flex items-center gap-2">
                    <IconBook size={16} />
                    <span>Reading Activity</span>
                  </div>
                ),
              },
              {
                value: "audit",
                label: (
                  <div className="flex items-center gap-2">
                    <IconList size={16} />
                    <span>Audit Log</span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {viewMode === "reading" ? <ReadingActivityView /> : <AuditLogView />}
      </Stack>
    </Container>
  );
};
