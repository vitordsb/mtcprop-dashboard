import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeScript = `
(() => {
  try {
    const savedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
