import type { PropsWithChildren } from "react";
import { App as AntdApp, ConfigProvider } from "antd";
import { ThemeProvider } from "@lobehub/ui";
import { IconoirProvider } from "iconoir-react";

import { appTheme } from "@/lib/app-theme";

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  return (
    <ConfigProvider theme={appTheme}>
      <ThemeProvider>
        <IconoirProvider
          iconProps={{
            color: "currentColor",
            strokeWidth: 1.9,
            width: "1em",
            height: "1em",
          }}
        >
          <AntdApp>{children}</AntdApp>
        </IconoirProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
};
