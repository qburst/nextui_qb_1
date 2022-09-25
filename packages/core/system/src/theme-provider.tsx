import React, {useState, useMemo, useEffect, ReactNode} from "react";
import {SSRProvider, OverlayProvider} from "react-aria";
import {deepMerge, copyObject} from "@nextui-org/shared-utils";
import {useSSR} from "@nextui-org/use-ssr";

import {changeTheme, getThemeName, getDocumentCSSTokens, getDocumentTheme} from "./utils";
import {CreateTheme, NextUITheme, NextUIThemeContext, ThemeType} from "./types";
import {ThemeContext, defaultContext} from "./theme-context";
import {CssBaseline} from "./css-baseline";

export interface NextUIProviderProps {
  theme?: CreateTheme;
  children?: ReactNode;
  disableBaseline?: boolean;
}

export const NextUIProvider: React.FC<NextUIProviderProps> = ({
  theme: userTheme,
  disableBaseline = false,
  children,
}) => {
  const {isBrowser} = useSSR();

  const [currentTheme, setCurrentTheme] = useState<ThemeType | string>(defaultContext.type);

  const changeCurrentTheme = (type: ThemeType | string) => {
    setCurrentTheme((ct) => (ct !== type ? type : ct));
  };

  const changeTypeBaseEl = (el: HTMLElement) => {
    const themeValue = getDocumentTheme(el);

    themeValue && changeCurrentTheme(themeValue);
  };

  const providerValue = useMemo<NextUIThemeContext>(() => {
    const themeTokens = isBrowser ? getDocumentCSSTokens() : {};
    const theme = deepMerge(copyObject(defaultContext.theme), themeTokens) as NextUITheme;
    const themeName = getThemeName(currentTheme);

    return {
      theme,
      type: themeName,
      isDark: themeName === "dark",
    };
  }, [currentTheme, isBrowser]);

  useEffect(() => {
    // initial set
    changeTypeBaseEl(document?.documentElement);

    const observer = new MutationObserver((mutation) => {
      if (mutation && mutation.length > 0 && mutation[0]?.target.nodeName === "BODY") {
        const documentTheme = document?.body?.dataset?.theme;

        documentTheme && changeCurrentTheme(documentTheme);
      } else {
        changeTypeBaseEl(document?.documentElement);
      }
    });

    observer.observe(document?.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });

    observer.observe(document?.body, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isBrowser || !userTheme) {
      return;
    }
    if (userTheme?.className) {
      changeTheme(userTheme.className);
      changeCurrentTheme(getThemeName(userTheme.className));
    }
  }, [isBrowser, userTheme]);

  return (
    <SSRProvider>
      <OverlayProvider>
        <ThemeContext.Provider value={providerValue}>
          {!disableBaseline && <CssBaseline />}
          {children}
        </ThemeContext.Provider>
      </OverlayProvider>
    </SSRProvider>
  );
};
