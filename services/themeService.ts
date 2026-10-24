export type ThemeMode = 'noturno' | 'diurno';

export type AppTheme = 
  // Modo Noturno (Escuro)
  | 'grimorio'       // Clássico SWADE: Pedra obsidiana + ouro velho
  | 'floresta'       // Floresta Ancestral: Musgo noturno profundo + jade místico
  | 'horror'         // Cripta & Sangue: Ônix carmesim + sangue seco
  | 'aco'            // Noite de Aço: Ardósia meia-noite + safira
  // Modo Diurno (Claro / Papiro / Pergaminho)
  | 'pergaminho'     // Pergaminho Nobre: Papiro e velino suave + tinta nogueira nobre
  | 'sertao'         // Cartografia do Sertão: Areia quente + terracota e siena
  | 'alvorada'       // Herbalista da Alvorada: Sálvia botânica suave + tinta floresta
  | 'marfim';        // Tomo Real de Marfim: Marfim refinado + azul heráldico

export type AppFontFamily = 'classico' | 'rustico' | 'tatico';
export type AppFontSize = 'normal' | 'large' | 'xlarge';

export interface ThemeSettings {
  nightTheme: AppTheme;
  dayTheme: AppTheme;
  mode: ThemeMode;
  theme: AppTheme;
  fontFamily: AppFontFamily;
  fontSize: AppFontSize;
}

const STORAGE_KEY = 'swade_bestiary_theme_settings';

export const NIGHT_THEMES: AppTheme[] = ['grimorio', 'floresta', 'horror', 'aco'];
export const DAY_THEMES: AppTheme[] = ['pergaminho', 'sertao', 'alvorada', 'marfim'];

// Intuitive matching between day and night counterpart themes
export const THEME_PAIRS: Record<AppTheme, AppTheme> = {
  grimorio: 'pergaminho',
  floresta: 'alvorada',
  horror: 'sertao',
  aco: 'marfim',
  pergaminho: 'grimorio',
  sertao: 'horror',
  alvorada: 'floresta',
  marfim: 'aco',
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  nightTheme: 'grimorio',
  dayTheme: 'pergaminho',
  mode: 'noturno',
  theme: 'grimorio',
  fontFamily: 'classico',
  fontSize: 'normal',
};

/**
 * Detects whether the user device/operating system prefers dark or light theme
 */
export const getSystemThemeMode = (): ThemeMode => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noturno' : 'diurno';
  }
  return 'noturno';
};

/**
 * Subscribes to real-time changes in the operating system/device theme (e.g. sunset or manual phone switch)
 */
export const subscribeToSystemTheme = (callback: (mode: ThemeMode) => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'noturno' : 'diurno');
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  } else if ((mediaQuery as any).addListener) {
    (mediaQuery as any).addListener(listener);
    return () => (mediaQuery as any).removeListener(listener);
  }
  return () => {};
};

export const getThemeSettings = (): ThemeSettings => {
  const systemMode = getSystemThemeMode();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let nightTheme: AppTheme = parsed.nightTheme;
      let dayTheme: AppTheme = parsed.dayTheme;

      if (!nightTheme) {
        if (NIGHT_THEMES.includes(parsed.theme)) {
          nightTheme = parsed.theme;
        } else {
          nightTheme = THEME_PAIRS[parsed.theme as AppTheme] || 'grimorio';
        }
      }
      if (!dayTheme) {
        if (DAY_THEMES.includes(parsed.theme)) {
          dayTheme = parsed.theme;
        } else {
          dayTheme = THEME_PAIRS[parsed.theme as AppTheme] || 'pergaminho';
        }
      }

      const activeTheme = systemMode === 'diurno' ? dayTheme : nightTheme;

      return { 
        ...DEFAULT_THEME_SETTINGS, 
        ...parsed,
        nightTheme,
        dayTheme,
        mode: systemMode,
        theme: activeTheme,
      };
    }
  } catch {}

  return {
    ...DEFAULT_THEME_SETTINGS,
    mode: systemMode,
    theme: systemMode === 'diurno' ? 'pergaminho' : 'grimorio',
  };
};

export const saveThemeSettings = (settings: ThemeSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyThemeToDOM(settings);
  } catch {}
};

export const applyThemeToDOM = (settings: ThemeSettings): void => {
  const root = document.documentElement;
  // Set data-attributes for mode, themes and fonts
  root.setAttribute('data-mode', settings.mode);
  root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-font', settings.fontFamily);
  root.setAttribute('data-size', settings.fontSize);

  // Set font size scale on root
  if (settings.fontSize === 'large') {
    root.style.fontSize = '17.5px';
  } else if (settings.fontSize === 'xlarge') {
    root.style.fontSize = '19px';
  } else {
    root.style.fontSize = '16px';
  }

  // Update browser mobile header color
  let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  const themeColors: Record<AppTheme, string> = {
    grimorio: '#0c0a09',
    floresta: '#06120a',
    horror: '#0d0608',
    aco: '#080d16',
    pergaminho: '#f4ecdc',
    sertao: '#f4ecde',
    alvorada: '#eef3ee',
    marfim: '#f6f4ed',
  };
  metaTheme.content = themeColors[settings.theme] || '#0c0a09';
};

export interface ThemeOptionItem {
  id: AppTheme;
  mode: ThemeMode;
  name: string;
  badge: string;
  description: string;
  bgHex: string;
  borderHex: string;
  textHex: string;
  previewClass: string;
}

// Theme metadata for selector UI
export const THEME_OPTIONS: ThemeOptionItem[] = [
  // NOTURNO
  {
    id: 'grimorio',
    mode: 'noturno',
    name: 'Grimório Sombrio',
    badge: 'Noturno • Clássico SWADE',
    description: 'Pedra obsidiana ancestral, ouro velho e detalhes em carmesim.',
    bgHex: '#0c0a09',
    borderHex: '#b45309',
    textHex: '#fef08a',
    previewClass: 'bg-[#0c0a09] border-amber-600/70 text-amber-300',
  },
  {
    id: 'floresta',
    mode: 'noturno',
    name: 'Floresta Ancestral',
    badge: 'Noturno • Caatinga & Selva',
    description: 'Musgo noturno profundo, folhas de ébano e runas de esmeralda.',
    bgHex: '#06120a',
    borderHex: '#059669',
    textHex: '#6ee7b7',
    previewClass: 'bg-[#06120a] border-emerald-600/70 text-emerald-400',
  },
  {
    id: 'horror',
    mode: 'noturno',
    name: 'Cripta & Sangue',
    badge: 'Noturno • Terror Gótico',
    description: 'Ônix abissal fúnebre, sangue carmesim seco e névoa gélida.',
    bgHex: '#0d0608',
    borderHex: '#dc2626',
    textHex: '#fca5a5',
    previewClass: 'bg-[#0d0608] border-red-700/80 text-red-400',
  },
  {
    id: 'aco',
    mode: 'noturno',
    name: 'Noite de Aço',
    badge: 'Noturno • Meia-Noite & Safira',
    description: 'Ardósia escura temperada, aço gélido e reflexos celestiais.',
    bgHex: '#080d16',
    borderHex: '#0284c7',
    textHex: '#7dd3fc',
    previewClass: 'bg-[#080d16] border-sky-600/70 text-sky-400',
  },

  // DIURNO (PERGAMINHOS CONFORTÁVEIS - SEM BRANCO ESTOURADO!)
  {
    id: 'pergaminho',
    mode: 'diurno',
    name: 'Pergaminho Nobre',
    badge: 'Diurno • Papiro Real',
    description: 'Papiro suave e velino aquecido com tinta nogueira nobre. 0% ofuscamento!',
    bgHex: '#f4ecdc',
    borderHex: '#997340',
    textHex: '#23150b',
    previewClass: 'bg-[#f4ecdc] border-[#997340] text-[#23150b]',
  },
  {
    id: 'sertao',
    mode: 'diurno',
    name: 'Cartografia do Sertão',
    badge: 'Diurno • Sol & Aventura',
    description: 'Areia dourada suave, terracota e couro siena. Alta nitidez sob o sol.',
    bgHex: '#f4ecde',
    borderHex: '#a0431b',
    textHex: '#211206',
    previewClass: 'bg-[#f4ecde] border-[#a0431b] text-[#211206]',
  },
  {
    id: 'alvorada',
    mode: 'diurno',
    name: 'Herbalista da Alvorada',
    badge: 'Diurno • Sálvia Botânica',
    description: 'Pergaminho sálvia botânico, tinta verde floresta e bronze rústico.',
    bgHex: '#eef3ee',
    borderHex: '#2e633d',
    textHex: '#0f2316',
    previewClass: 'bg-[#eef3ee] border-[#2e633d] text-[#0f2316]',
  },
  {
    id: 'marfim',
    mode: 'diurno',
    name: 'Tomo Real de Marfim',
    badge: 'Diurno • Marfim Heráldico',
    description: 'Marfim suave polido, tinta azul heráldica e dourado imperial refinado.',
    bgHex: '#f6f4ed',
    borderHex: '#1e40af',
    textHex: '#111827',
    previewClass: 'bg-[#f6f4ed] border-[#1e40af] text-[#111827]',
  },
];

export const FONT_OPTIONS: { id: AppFontFamily; name: string; description: string }[] = [
  { id: 'classico', name: 'Grimório Épico', description: 'Cinzel + Crimson Pro (Clássico de Fantasia)' },
  { id: 'rustico', name: 'Crônicas Rústicas', description: 'Cinzel Decorativo + Crimson Pro Itálico' },
  { id: 'tatico', name: 'Tático & Nítido', description: 'Inter + JetBrains Mono (Moderno de Alta Legibilidade)' },
];

export const FONT_SIZE_OPTIONS: { id: AppFontSize; name: string; scale: string }[] = [
  { id: 'normal', name: 'Normal', scale: '100%' },
  { id: 'large', name: 'Grande (+15%)', scale: '115%' },
  { id: 'xlarge', name: 'Mesa / TV (+30%)', scale: '130%' },
];
