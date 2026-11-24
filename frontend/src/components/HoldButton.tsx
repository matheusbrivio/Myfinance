import { useId, useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import { useSegurar } from '../hooks/useSegurar';

import './HoldButton.css';


export interface HoldButtonProps {
  children?: ReactNode;
  doneLabel?: ReactNode;
  icon?: ReactNode;
  doneIcon?: ReactNode;
  backgroundColor?: string;
  fillColor?: string;
  textColor?: string;
  fillTextColor?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  fillDirection?: 'right' | 'up';
  holdTime?: number;
  releaseTime?: number;
  pressScale?: number;
  wave?: boolean;
  waveAmplitude?: number;
  glow?: boolean;
  resetAfter?: number;
  disabled?: boolean;
  onHold?: () => void;
  onTap?: () => void;
  className?: string;
}


export default function HoldButton({
  children = 'Hold to delete',
  doneLabel = 'Deleted',
  icon = null,
  doneIcon = null,
  backgroundColor = '#27272a',
  fillColor = '#5227FF',
  textColor = '#f5f5f5',
  fillTextColor = '#ffffff',
  size = 'md',
  radius = 14,
  fillDirection = 'right',
  holdTime = 2000,
  releaseTime = 200,
  pressScale = 0.97,
  wave = true,
  waveAmplitude = 6,
  glow = true,
  resetAfter = 1200,
  disabled = false,
  onHold,
  onTap,
  className = ''
}: HoldButtonProps) {
  // A mecânica de segurar (ponteiro, teclado, cancelamentos) vive no hook useSegurar.
  // O progresso é escrito direto em --hb-p, como antes.
  const { ref: buttonRef, fase: phase, entrada: input, handlers } = useSegurar<HTMLButtonElement>({
    tempo: holdTime, soltar: releaseTime, desativado: disabled, reiniciarApos: resetAfter,
    aoCompletar: onHold, aoToque: onTap,
    aoProgresso: p => buttonRef.current?.style.setProperty('--hb-p', p.toFixed(4)),
  });
  const hintId = useId();

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return undefined;
    const measure = () => {
      button.style.setProperty('--hb-w', `${button.offsetWidth}px`);
      button.style.setProperty('--hb-h', `${button.offsetHeight}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(button);
    return () => ro.disconnect();
  }, []);

  const direction = fillDirection === 'up' ? 'up' : 'right';
  const labels = (
    <>
      <span className="hold-button__idle" aria-hidden={phase === 'done'}>
        {icon ? <span className="hold-button__icon">{icon}</span> : null}
        {children}
      </span>
      <span className="hold-button__done" aria-hidden={phase !== 'done'}>
        {doneIcon ? <span className="hold-button__icon">{doneIcon}</span> : null}
        {doneLabel}
      </span>
    </>
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      className={`hold-button hold-button--${size}${className ? ` ${className}` : ''}`}
      data-phase={phase}
      data-input={input ?? undefined}
      data-direction={direction}
      data-glow={glow ? 'true' : undefined}
      aria-describedby={hintId}
      style={{
        '--hb-radius': `${radius}px`,
        '--hb-bg': backgroundColor,
        '--hb-fill': fillColor,
        '--hb-text': textColor,
        '--hb-fill-text': fillTextColor,
        '--hb-hold': `${holdTime}ms`,
        '--hb-cycles': holdTime / 1100,
        '--hb-release': `${releaseTime}ms`,
        '--hb-press': pressScale,
        '--hb-wave': `${wave ? waveAmplitude : 0}px`
      } as CSSProperties}
      {...handlers}
    >
      <span className="hold-button__pulse" aria-hidden="true" />
      <span className="hold-button__label">{labels}</span>
      <span className="hold-button__clip" aria-hidden="true">
        <span className="hold-button__fill">
          <span className="hold-button__label hold-button__label--fill">{labels}</span>
        </span>
        <span className="hold-button__crest" aria-hidden="true">
          <span className="hold-button__label hold-button__label--fill">{labels}</span>
        </span>
      </span>
      <span id={hintId} className="hold-button__sr">
        Pressione e segure por {String(Math.round(holdTime / 100) / 10).replace('.', ',')} {holdTime < 2000 ? 'segundo' : 'segundos'} para confirmar
      </span>
    </button>
  );
}

