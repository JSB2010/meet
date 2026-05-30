import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'jb-credit': React.HTMLAttributes<HTMLElement> & {
        'data-variant'?: 'prominent' | 'chip' | 'badge' | 'logo' | 'minimal' | 'text' | 'data-only';
        'data-theme'?: 'light' | 'dark' | 'auto';
        'data-position'?: 'inline' | 'fixed';
        'data-size'?: 'small' | 'default' | 'large';
        'data-align'?: 'left' | 'right' | 'center';
        'data-bottom-offset'?: string;
        'data-effects'?: 'full' | 'none';
        'data-no-track'?: string | boolean;
        'data-no-rules'?: string | boolean;
        'data-site'?: string;
        'data-page-group'?: string;
        'data-experiment'?: string;
        'data-debug'?: string | boolean;
      };
    }
  }
}
