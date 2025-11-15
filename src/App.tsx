import { RouterProvider } from "react-router";

import { router } from "./routes";
import { useWebSocketBridge } from "./hooks/useWebSocketBridge";

const App = () => {
  // Mount WebSocket bridge for real-time updates
  useWebSocketBridge({
    enableNotifications: true,
    notifyOnDownloadComplete: true,
    notifyOnDownloadFailed: true,
    notifyOnLibraryChanges: false, // Library changes are user-initiated, no need for noise
  });

  return <RouterProvider router={router} />;
};

export default App;
