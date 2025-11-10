import { Button, Container, Text, Title } from "@mantine/core";
import React from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../routes/routes.config";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Title order={1} className="mb-4 text-8xl font-bold text-gray-800">
        404
      </Title>

      <Title order={2} className="mb-4 text-3xl font-semibold text-gray-700">
        Page Not Found
      </Title>

      <Text className="mb-8 max-w-md text-gray-600">
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
