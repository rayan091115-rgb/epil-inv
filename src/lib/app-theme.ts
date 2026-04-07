import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: "#121316",
    colorInfo: "#121316",
    colorSuccess: "#0f766e",
    colorWarning: "#b45309",
    colorError: "#991b1b",
    colorText: "#121316",
    colorTextSecondary: "#5b616d",
    colorBorder: "#d9dde3",
    colorBgBase: "#f6f7f9",
    colorBgContainer: "#ffffff",
    colorFillSecondary: "#f1f3f6",
    colorFillTertiary: "#ebedf1",
    controlHeight: 40,
    borderRadius: 14,
    borderRadiusLG: 18,
    boxShadowSecondary: "0 20px 50px rgba(16, 24, 40, 0.08)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Card: {
      borderRadiusLG: 24,
      boxShadowTertiary: "0 20px 50px rgba(16, 24, 40, 0.08)",
    },
    Tabs: {
      itemColor: "#6b7280",
      itemSelectedColor: "#121316",
      itemHoverColor: "#121316",
      inkBarColor: "#121316",
      cardBg: "#f1f3f6",
    },
    Button: {
      borderRadius: 12,
      defaultBg: "#ffffff",
      defaultBorderColor: "#d9dde3",
      defaultColor: "#121316",
      defaultHoverBorderColor: "#b8bec9",
      defaultHoverColor: "#121316",
      defaultShadow: "none",
      primaryShadow: "none",
    },
    Input: {
      activeBorderColor: "#121316",
      hoverBorderColor: "#121316",
      activeShadow: "0 0 0 3px rgba(18, 19, 22, 0.08)",
    },
    Select: {
      activeBorderColor: "#121316",
      hoverBorderColor: "#121316",
      activeOutlineColor: "rgba(18, 19, 22, 0.08)",
    },
    Modal: {
      borderRadiusLG: 24,
    },
  },
};
