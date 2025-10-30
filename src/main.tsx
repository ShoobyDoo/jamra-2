import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import App from './App.tsx';
import { queryClient } from './lib/query-client.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <App />
      </MantineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
