export const themes = {
  light: {
    name: 'Light Mode',
    bg: '#f4f6f8',
    cardBg: '#ffffff',
    text: '#333333',
    subText: '#666666',
    border: '#e0e0e0',
    primary: '#2196F3'
  },
  dark: {
    name: 'Dark Mode',
    bg: '#0f172a',
    cardBg: '#1e293b',
    text: '#f8fafc',
    subText: '#94a3b8',
    border: '#334155',
    primary: '#3b82f6'
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36',
    cardBg: '#44475a',
    text: '#f8f8f2',
    subText: '#6272a4',
    border: '#6272a4',
    primary: '#bd93f9'
  },
  nord: {
    name: 'Nord',
    bg: '#2e3440',
    cardBg: '#3b4252',
    text: '#eceff4',
    subText: '#d8dee9',
    border: '#4c566a',
    primary: '#88c0d0'
  },
  solarizedDark: {
    name: 'Solarized Dark',
    bg: '#002b36',
    cardBg: '#073642',
    text: '#eee8d5',
    subText: '#93a1a1',
    border: '#586e75',
    primary: '#2aa198'
  },
  solarizedLight: {
    name: 'Solarized Light',
    bg: '#fdf6e3',
    cardBg: '#eee8d5',
    text: '#657b83',
    subText: '#93a1a1',
    border: '#d33682',
    primary: '#268bd2'
  },
  forest: {
    name: 'Forest',
    bg: '#1b2e23',
    cardBg: '#264232',
    text: '#e8f5e9',
    subText: '#a5d6a7',
    border: '#388e3c',
    primary: '#66bb6a'
  },
  sunset: {
    name: 'Sunset',
    bg: '#2b1b1b',
    cardBg: '#3d2626',
    text: '#fbe9e7',
    subText: '#ffab91',
    border: '#d84315',
    primary: '#ff7043'
  }
}

export const themeList = Object.keys(themes).map((key) => ({
  key,
  name: themes[key].name
}))