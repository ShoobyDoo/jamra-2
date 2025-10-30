import React from 'react';
import { Button, Text, Title, Container, Code } from '@mantine/core';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router';
import { ROUTES } from '../routes/routes.config';

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
  const getErrorMessage = (): { title: string; message: string; details?: string } => {
    if (isRouteErrorResponse(error)) {
      return {
        title: `${error.status} ${error.statusText}`,
        message: error.data?.message || 'An error occurred while loading this page.',
        details: error.data?.details,
      };
    }

    if (error instanceof Error) {
      return {
        title: 'Application Error',
        message: error.message,
        details: error.stack,
      };
    }

    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred.',
    };
  };

  const { title, message, details } = getErrorMessage();

  return (
    <Container className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Title order={1} className="text-6xl font-bold text-red-600 mb-4">
        Oops!
      </Title>

      <Title order={2} className="text-2xl font-semibold text-gray-700 mb-4">
        {title}
      </Title>

      <Text className="text-gray-600 mb-6 max-w-md">
        {message}
      </Text>

      {details && import.meta.env.DEV && (
        <Code block className="mb-6 max-w-2xl text-left overflow-auto max-h-48">
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
