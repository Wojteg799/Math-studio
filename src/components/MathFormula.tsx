import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathFormulaProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ math, block = false, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // If the string contains \( ... \) or \[ ... \] or is a mixed string
      const trimmed = math.trim();
      const hasDelimiters = trimmed.includes('\\(') || trimmed.includes('\\[') || trimmed.includes('$');

      if (hasDelimiters) {
        // Render mixed text with embedded TeX equations
        containerRef.current.innerHTML = renderMixedLatex(trimmed);
      } else {
        // Pure LaTeX expression
        katex.render(trimmed, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          strict: false
        });
      }
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      if (containerRef.current) {
        containerRef.current.textContent = math;
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className={`inline-block select-text ${className}`} />;
};

/**
 * Parses a string containing LaTeX delimiters \( ... \), \[ ... \], and standard text.
 */
function renderMixedLatex(text: string): string {
  // Replace \[ ... \] block formulas
  let processed = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => {
    try {
      return katex.renderToString(equation.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return `<code>${equation}</code>`;
    }
  });

  // Replace $$ ... $$ block formulas
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, equation) => {
    try {
      return katex.renderToString(equation.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return `<code>${equation}</code>`;
    }
  });

  // Replace \( ... \) inline formulas
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => {
    try {
      return katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<code>${equation}</code>`;
    }
  });

  // Replace $ ... $ inline formulas
  processed = processed.replace(/\$([^$]+?)\$/g, (_match, equation) => {
    try {
      return katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<code>${equation}</code>`;
    }
  });

  // Convert newlines to breaks where appropriate
  processed = processed.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  // Convert bold markdown **text**
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-amber-300 font-semibold">$1</strong>');

  return processed;
}

