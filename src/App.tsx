import { Text } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppLayout } from "./components/AppLayout";

const HomePage = () => {
  return (
    <>
      <Text size="xl" fw={700} mb="md">
        Welcome to Your App
      </Text>
      <Text>This is the main section, your app content here.</Text>
      <Text mt="md">
        Header/footer height and navbar/aside width can be responsive. Try
        resizing the screen to see sizes changes.
      </Text>
    </>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Add more routes here as needed
      // {
      //   path: "about",
      //   element: <AboutPage />,
      // },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
