import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';
// @ts-expect-error untyped font file
import font from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2';

export default createGlobalStyle`
    @font-face {
        font-family: 'IBM Plex Sans';
        font-style: normal;
        font-display: swap;
        font-weight: 100 700;
        src: url(${font}) format('woff2-variations');
        unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
    }

    :root {
        --bg-0: #0b0d10;
        --bg-1: #12161c;
        --bg-2: #171c23;
        --panel: #12161c;
        --panel-strong: #1f2630;
        --card: #171c23;
        --elevated: #1f2630;
        --border: #2a3340;
        --divider: #202734;
        --accent: #ffb703;
        --accent-strong: #f6c230;
        --accent-hover: #fbda4d;
        --accent-active: #e4a91c;
        --accent-soft: rgba(246, 194, 48, 0.18);
        --text-primary: #e8eef6;
        --text-secondary: #b7c0cc;
        --text-muted: #7e8a99;
        --text-on-primary: #0b0d10;
        --success: #22c55e;
        --warning: #f59e0b;
        --error: #ef4444;
        --info: #38bdf8;
        --radius-lg: 16px;
        --radius-md: 12px;
    }

    body {
        ${tw`font-sans`};
        color: var(--text-primary);
        letter-spacing: 0.015em;
        background: radial-gradient(1200px 700px at 20% -10%, #1f2630 0%, var(--bg-0) 55%, #0b0d10 100%);
    }

    #app {
        min-height: 100vh;
        background: linear-gradient(160deg, rgba(18, 22, 28, 0.7), rgba(11, 13, 16, 0.95));
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-medium tracking-normal font-header`};
    }

    p {
        ${tw`leading-snug font-sans`};
        color: var(--text-secondary);
    }

    a {
        color: inherit;
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    input, select, textarea {
        border-radius: var(--radius-md);
    }

    button {
        border-radius: var(--radius-md);
    }

    .rounded,
    .rounded-md,
    .rounded-lg,
    .rounded-xl,
    .rounded-2xl {
        border-radius: var(--radius-lg) !important;
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Scroll Bar Style */
    ::-webkit-scrollbar {
        background: none;
        width: 16px;
        height: 16px;
    }

    ::-webkit-scrollbar-thumb {
        border: solid 0 rgb(0 0 0 / 0%);
        border-right-width: 4px;
        border-left-width: 4px;
        -webkit-border-radius: 9px 4px;
        -webkit-box-shadow: inset 0 0 0 1px rgba(42, 51, 64, 0.7), inset 0 0 0 4px rgba(18, 22, 28, 0.9);
    }

    ::-webkit-scrollbar-track-piece {
        margin: 4px 0;
    }

    ::-webkit-scrollbar-thumb:horizontal {
        border-right-width: 0;
        border-left-width: 0;
        border-top-width: 4px;
        border-bottom-width: 4px;
        -webkit-border-radius: 4px 9px;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }
`;
