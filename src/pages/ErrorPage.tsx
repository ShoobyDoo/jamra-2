import { Button, Code, Container, Text, Title } from "@mantine/core";
import React from "react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { ROUTES } from "../routes/routes.config";

export const ErrorPage: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Type guard for route errors
  const getErrorMessage = (): {
    title: string;
    message: string;
    details?: string;
  } => {
    if (isRouteErrorResponse(error)) {
      return {
        title: `${error.status} ${error.statusText}`,
        message:
          error.data?.message || "An error occurred while loading this page.",
        details: error.data?.details,
      };
    }

    if (error instanceof Error) {
      return {
        title: "Application Error",
        message: error.message,
        details: error.stack,
      };
    }

    return {
      title: "Unknown Error",
      message: "An unexpected error occurred.",
    };
  };

  const { title, message, details } = getErrorMessage();

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Title order={1} className="mb-4 text-6xl font-bold text-red-600">
        Oops!
      </Title>

      <Title order={2} className="mb-4 text-2xl font-semibold text-gray-700">
        {title}
      </Title>

      <Text className="mb-6 max-w-md text-gray-600">{message}</Text>

      {details && import.meta.env.DEV && (
        <Code block className="mb-6 max-h-48 max-w-2xl overflow-auto text-left">
          {details}
        </Code>
      )}

      <div className="flex gap-4">
        <Button
          variant="filled"
          color="dark"
          onClick={handleGoHome}
          className="min-w-[120px]"
        >
          Go Home
        </Button>

        <Button
          variant="outline"
          color="dark"
          onClick={handleReload}
          className="min-w-[120px]"
        >
          Reload Page
        </Button>
      </div>
    </Container>
  );
};
