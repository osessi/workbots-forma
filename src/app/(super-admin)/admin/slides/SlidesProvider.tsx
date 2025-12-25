'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/slides-store/store';

export function SlidesProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
