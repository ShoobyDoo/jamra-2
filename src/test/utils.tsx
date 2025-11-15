import React from "react";
import {
  render,
  type RenderOptions,
  renderHook as rtlRenderHook,
  type RenderHookOptions,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
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
  const client = queryClient || createTestQueryClient();

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
  createTestQueryClient,
};
