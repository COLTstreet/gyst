import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Brand palette: #FBAB57 / #FEC674 (accent, base + hover) and #222222 / #FFF3E2
 * (background + text). The 11-step ramps below aren't arbitrary — they're
 * generated with the same tint-toward-white / shade-toward-black math Aura
 * itself uses for named colors (see @primeuix/styled's `palette()`), anchored
 * so #FBAB57 lands exactly on primary.500 and the surface ramp runs from
 * #FFF3E2 (50) down to #222222 (900). That keeps every component-level token
 * reference (hover backgrounds, disabled states, borders, etc.) consistent
 * instead of only the couple of steps a template happens to use directly.
 */
const primary = {
  50: '#FFFBF7',
  100: '#FEEBD7',
  200: '#FDDBB7',
  300: '#FDCB97',
  400: '#FCBB77',
  500: '#FBAB57',
  600: '#D5914A',
  700: '#B0783D',
  800: '#8A5E30',
  900: '#644423',
  950: '#3F2B16',
};

const surface = {
  0: '#FFFFFF',
  50: '#FFF3E2',
  100: '#E7DCCD',
  200: '#CEC5B7',
  300: '#B5ADA2',
  400: '#9D968D',
  500: '#847F77',
  600: '#6C6862',
  700: '#53504D',
  800: '#3B3937',
  900: '#222222',
  950: '#101113',
};

/**
 * GYST always renders dark (see darkModeSelector in app.config.ts — the
 * '.app-dark' class is hardcoded onto <html> in index.html, not toggled),
 * so the "light" colorScheme branch is never actually shown to a user; it's
 * left at Aura's defaults and only the dark branch is customized.
 */
export const GystPreset = definePreset(Aura, {
  semantic: {
    primary,
    typography: {
      fontFamily: "'Rubik', system-ui, sans-serif",
    },
    text: {
      color: '#FFF3E2',
      mutedColor: surface[300],
    },
    colorScheme: {
      dark: {
        surface,
        primary: {
          color: '{primary.500}', // exactly #FBAB57
          hoverColor: '#FEC674', // your given lighter tone, used verbatim
          activeColor: '{primary.300}',
          contrastColor: '#222222', // readable label color on top of the orange
        },
      },
    },
  },
  components: {
    // Card only, not the shared `content.*` semantic tokens — those also
    // back ~15 other components (Dialog, Menu, Toast, DataTable, ...) and
    // overriding them globally would have made all of those cream too.
    card: {
      colorScheme: {
        dark: {
          root: {
            background: '#FFF3E2',
            color: '#222222',
          },
          subtitle: {
            color: surface[600],
          },
        },
      },
    },
  },
});
