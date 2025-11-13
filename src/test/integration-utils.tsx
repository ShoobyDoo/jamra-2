import React from "react";
import {
  render,
  RenderOptions,
  renderHook as rtlRenderHook,
  RenderHookOptions,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const createIntegrationQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1, // Allow one retry for flaky network
        gcTime: 0, // Don't cache between tests
        staleTime: 0,
      },
      mutations: {
        retry: 0,
      },
    },
  });

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  queryClient,
}) => {
  const client = queryClient || createIntegrationQueryClient();

  return (
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MantineProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions,
) => {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
};

interface CustomRenderHookOptions<Props>
  extends Omit<RenderHookOptions<Props>, "wrapper"> {
  queryClient?: QueryClient;
}

const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: CustomRenderHookOptions<Props>,
) => {
  const { queryClient, ...renderOptions } = options || {};

  return rtlRenderHook(hook, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
};

export * from "@testing-library/react";
export {
  customRender as render,
  customRenderHook as renderHook,
  createIntegrationQueryClient,
};
