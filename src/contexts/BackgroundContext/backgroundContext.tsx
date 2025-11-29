import { createContext, useContext, useState } from 'react';

type BackgroundContextType = {
  dynamicBg: string | null;
  setDynamicBg: (url: string | null) => void;
};

const BackgroundContext = createContext<BackgroundContextType>({
  dynamicBg: null,
  setDynamicBg: () => {},
});

export function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dynamicBg, setDynamicBg] = useState<string | null>(null);

  return (
    <BackgroundContext.Provider value={{ dynamicBg, setDynamicBg }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
