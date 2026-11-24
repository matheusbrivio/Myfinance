import AnimatedContent, { type AnimatedContentProps } from './AnimatedContent'

// Entrada padrão do app: sutil e curta. `agrupar` anima os filhos diretos em sequência.
export function Entrada({ agrupar = false, trigger = 'mount', ...props }:
  Omit<AnimatedContentProps, 'distance' | 'duration' | 'ease' | 'blur' | 'stagger' | 'once'> & { agrupar?: boolean }) {
  return <AnimatedContent distance={20} duration={0.5} ease="power3.out" blur={4} stagger={agrupar ? 0.06 : 0} once trigger={trigger} {...props}/>
}
