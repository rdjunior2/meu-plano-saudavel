export interface ThemeColors {
  text: string;
  hover: string;
  after: string;
  icon: string;
}

export const getThemeColors = (isAdminRoute: boolean): ThemeColors => {
  // Modificadores de cor baseados na rota
  const adminColors: ThemeColors = {
    text: "text-sky-700",
    hover: "hover:text-sky-500",
    after: "after:bg-sky-500",
    icon: "text-sky-700"
  };
  
  const defaultColors: ThemeColors = {
    text: "text-emerald-700",
    hover: "hover:text-emerald-500",
    after: "after:bg-emerald-500",
    icon: "text-emerald-700"
  };
  
  return isAdminRoute ? adminColors : defaultColors;
};

export default getThemeColors; 