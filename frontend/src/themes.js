export const themes = {
  light: {
    name: 'Default Light',
    bg: '#f4f6f8',
    cardBg: '#ffffff',
    text: '#333333',
    subText: '#666666',
    border: '#e0e0e0',
    primary: '#2196F3',
    accentBg: '#e3f2fd'
  },
  dark: {
    name: 'Dark Mode',
    bg: '#121212',
    cardBg: '#1e1e1e',
    text: '#f5f5f5',
    subText: '#aaaaaa',
    border: '#333333',
    primary: '#2196F3',
    accentBg: '#2a2a2a'
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36',
    cardBg: '#44475a',
    text: '#f8f8f2',
    subText: '#6272a4',
    border: '#6272a4',
    primary: '#bd93f9',
    accentBg: '#383a59'
  },
  catppuccin: {
    name: 'Catppuccin Mocha',
    bg: '#1e1e2e',
    cardBg: '#313244',
    text: '#cdd6f4',
    subText: '#a6adc8',
    border: '#45475a',
    primary: '#cba6f7',
    accentBg: '#45475a'
  },
  nord: {
    name: 'Nord',
    bg: '#2e3440',
    cardBg: '#3b4252',
    text: '#eceff4',
    subText: '#d8dee9',
    border: '#4c566a',
    primary: '#88c0d0',
    accentBg: '#434c5e'
  },
  tokyoNight: {
    name: 'Tokyo Night',
    bg: '#1a1b26',
    cardBg: '#24283b',
    text: '#a9b1d6',
    subText: '#787c99',
    border: '#414868',
    primary: '#7aa2f7',
    accentBg: '#292e42'
  },
  gruvbox: {
    name: 'Gruvbox Dark',
    bg: '#282828',
    cardBg: '#3c3836',
    text: '#ebdbb2',
    subText: '#a89984',
    border: '#504945',
    primary: '#fe8019',
    accentBg: '#504945'
  },
  solarized: {
    name: 'Solarized Dark',
    bg: '#002b36',
    cardBg: '#073642',
    text: '#93a1a1',
    subText: '#657b83',
    border: '#586e75',
    primary: '#268bd2',
    accentBg: '#0e4855'
  },
  forest: {
    name: 'Forest Green',
    bg: '#0f1b14',
    cardBg: '#1b2e23',
    text: '#e8f5e9',
    subText: '#a5d6a7',
    border: '#2e4c38',
    primary: '#4caf50',
    accentBg: '#253f30'
  },
  plum: {
    name: 'Plum',
    bg: '#1a0d1a',
    cardBg: '#2d1b2d',
    text: '#f3e5f5',
    subText: '#ce93d8',
    border: '#4a2c4a',
    primary: '#ab47bc',
    accentBg: '#3d253d'
  }
}

// Array list mapped dynamically for user selection dropdowns
export const themeList = Object.keys(themes).map((key) => ({
  key,
  name: themes[key].name
}))