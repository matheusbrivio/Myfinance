import { Slot } from '@radix-ui/react-slot'
import type { ComponentProps } from 'react'
import { botao, primario } from './ui'

// Primitiva Button do shadcn/ui com os tokens do MyFinance.
export function Button({ asChild = false, variant = 'default', className = '', ...props }:
  ComponentProps<'button'> & { asChild?: boolean; variant?: 'default' | 'outline' }) {
  const Elemento = asChild ? Slot : 'button'
  return <Elemento className={(variant === 'default' ? primario : botao) + ' ' + className} {...props}/>
}
