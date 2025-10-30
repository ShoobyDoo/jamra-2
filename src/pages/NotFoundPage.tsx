import React from 'react';
import { Button, Text, Title, Container } from '@mantine/core';
import { useNavigate } from 'react-router';
import { ROUTES } from '../routes/routes.config';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Title order={1} className="text-8xl font-bold text-gray-800 mb-4">
        404
      </Title>

      <Title order={2} className="text-3xl font-semibold text-gray-700 mb-4">
        Page Not Found
      </Title>

      <Text className="text-gray-600 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </Text>

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
          onClick={handleGoBack}
          className="min-w-[120px]"
        >
          Go Back
        </Button>
      </div>
    </Container>
  );
};
