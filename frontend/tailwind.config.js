/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "secondary-container": "#920703",
        "error": "#ffb4ab",
        "on-surface": "#e5e2e1",
        "surface-bright": "#393939",
        "inverse-on-surface": "#313030",
        "primary-fixed-dim": "#e9c349",
        "on-surface-variant": "#d0c5af",
        "on-background": "#e5e2e1",
        "on-secondary-fixed-variant": "#920703",
        "on-secondary-fixed": "#410000",
        "surface-container": "#20201f",
        "on-tertiary-fixed": "#141f00",
        "surface-container-highest": "#353535",
        "background": "#131313",
        "secondary": "#ffb4a8",
        "surface-container-lowest": "#0e0e0e",
        "secondary-fixed": "#ffdad4",
        "on-primary": "#3c2f00",
        "surface-container-low": "#1c1b1b",
        "surface": "#131313",
        "inverse-surface": "#e5e2e1",
        "surface-dim": "#131313",
        "error-container": "#93000a",
        "on-primary-fixed-variant": "#574500",
        "tertiary-fixed": "#d4eca2",
        "on-primary-container": "#554300",
        "on-tertiary-fixed-variant": "#3b4d14",
        "primary-fixed": "#ffe088",
        "outline-variant": "#4d4635",
        "inverse-primary": "#735c00",
        "primary-container": "#d4af37",
        "outline": "#99907c",
        "surface-tint": "#e9c349",
        "tertiary-container": "#a5bb76",
        "tertiary": "#c0d78f",
        "surface-variant": "#353535",
        "on-secondary": "#690000",
        "tertiary-fixed-dim": "#b8cf88",
        "on-error-container": "#ffdad6",
        "on-secondary-container": "#ff9a8a",
        "on-error": "#690005",
        "secondary-fixed-dim": "#ffb4a8",
        "on-primary-fixed": "#241a00",
        "surface-container-high": "#2a2a2a",
        "primary": "#f2ca50",
        "on-tertiary-container": "#394b13",
        "on-tertiary": "#253600"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-desktop": "48px",
        "margin-mobile": "16px",
        "blueprint-grid": "32px",
        "unit": "4px",
        "gutter": "16px"
      },
      fontFamily: {
        "label-sm": ["JetBrains Mono"],
        "headline-lg": ["Playfair Display"],
        "title-md": ["Inter"],
        "headline-lg-mobile": ["Playfair Display"],
        "display-lg": ["Playfair Display"],
        "body-md": ["Inter"]
      },
      fontSize: {
        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "500" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
        "title-md": ["18px", { "lineHeight": "24px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
      },
      backgroundImage: {
        'blueprint-pattern': 'linear-gradient(rgba(192, 192, 192, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(192, 192, 192, 0.05) 1px, transparent 1px)'
      }
    },
  },
  plugins: [],
}
