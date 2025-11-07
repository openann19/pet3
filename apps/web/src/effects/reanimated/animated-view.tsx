'use client'

import type { CSSProperties, ReactNode } from 'react'
import { forwardRef, useEffect, useRef, useState } from 'react'

interface AnimatedStyleReturn {
  readonly value: unknown
}

// Accept any style object that could come from useAnimatedStyle or be used as CSS
// Using a permissive type since we convert to CSS at runtime anyway
// react-native-reanimated's useAnimatedStyle returns AnimatedStyle<DefaultStyle> 
// where DefaultStyle = ViewStyle | TextStyle | ImageStyle (React Native types)
// Since we're in a web environment, we can't import those types, so we accept any style-like object
export type AnimatedStyle =
  | AnimatedStyleReturn
  | {
      // Match React Native style properties that useAnimatedStyle might return
      opacity?: number
      transform?: Record<string, number | string>[]
      backgroundColor?: string | number
      color?: string | number
      height?: number | string
      width?: number | string
      [key: string]: unknown
    }
  | (() => {
      opacity?: number
      transform?: Record<string, number | string>[]
      backgroundColor?: string | number
      color?: string | number
      height?: number | string
      width?: number | string
      [key: string]: unknown
    })
  | (() => Record<string, unknown>)
  | ((...args: unknown[]) => Record<string, unknown>)
  | Record<string, unknown>
  | undefined

interface AnimatedViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  readonly children?: ReactNode
  readonly style?: AnimatedStyle | AnimatedStyle[] | CSSProperties
}

type ResolvedAnimatedStyle = AnimatedStyle | CSSProperties | undefined

function isAnimatedStyleReturn(value: unknown): value is AnimatedStyleReturn {
  return Boolean(value) && typeof value === 'object' && 'value' in (value as Record<string, unknown>)
}

function convertToCSSProperties(style: unknown): CSSProperties {
  if (!style || typeof style !== 'object') {
    return {}
  }

  const cssStyle: CSSProperties = { ...(style as CSSProperties) }
  const styleObj = style as Record<string, unknown>

  if (styleObj['transform'] && Array.isArray(styleObj['transform'])) {
    const transforms: string[] = []
    styleObj['transform'].forEach((t: unknown) => {
      if (t && typeof t === 'object') {
        const transform = t as Record<string, unknown>
        const scale = transform['scale']
        if (typeof scale === 'number' || typeof scale === 'string') {
          transforms.push(`scale(${scale})`)
        }
        const translateX = transform['translateX']
        if (typeof translateX === 'number') {
          transforms.push(`translateX(${translateX}px)`)
        } else if (typeof translateX === 'string' && translateX.trim().length > 0) {
          transforms.push(`translateX(${translateX})`)
        }
        const translateY = transform['translateY']
        if (typeof translateY === 'number') {
          transforms.push(`translateY(${translateY}px)`)
        } else if (typeof translateY === 'string' && translateY.trim().length > 0) {
          transforms.push(`translateY(${translateY})`)
        }
        const rotateX = transform['rotateX']
        if (typeof rotateX === 'string' && rotateX.trim().length > 0) {
          transforms.push(`rotateX(${rotateX})`)
        } else if (typeof rotateX === 'number') {
          transforms.push(`rotateX(${rotateX}deg)`)
        }
        const rotateY = transform['rotateY']
        if (typeof rotateY === 'string' && rotateY.trim().length > 0) {
          transforms.push(`rotateY(${rotateY})`)
        } else if (typeof rotateY === 'number') {
          transforms.push(`rotateY(${rotateY}deg)`)
        }
        const rotate = transform['rotate']
        if (typeof rotate === 'string' && rotate.trim().length > 0) {
          transforms.push(`rotate(${rotate})`)
        } else if (typeof rotate === 'number') {
          transforms.push(`rotate(${rotate}deg)`)
        } else if (typeof rotate === 'object' && rotate !== null && 'value' in (rotate as Record<string, unknown>)) {
          const rotateValue = (rotate as Record<string, unknown>)['value']
          if (typeof rotateValue === 'number') {
            transforms.push(`rotate(${rotateValue}deg)`)
          } else if (typeof rotateValue === 'string') {
            transforms.push(`rotate(${rotateValue})`)
          }
        }
      }
    })
    if (transforms.length > 0) {
      cssStyle.transform = transforms.join(' ')
    }
  }

  if (styleObj['opacity'] !== undefined) {
    cssStyle.opacity = Number(styleObj['opacity'])
  }

  if (styleObj['shadowColor'] !== undefined) {
    const shadowOffset = styleObj['shadowOffset'] as { width?: number; height?: number } | undefined
    const shadowRadius = styleObj['shadowRadius'] as number | undefined
    const offsetWidth = shadowOffset?.width ?? 0
    const offsetHeight = shadowOffset?.height ?? 0
    const radius = shadowRadius ?? 0
    const rawShadowColor = styleObj['shadowColor']
    if (typeof rawShadowColor === 'string' || typeof rawShadowColor === 'number') {
      const shadowColor = String(rawShadowColor)
      cssStyle.boxShadow = `${offsetWidth}px ${offsetHeight}px ${radius}px ${shadowColor}`
    }
  }

  if (styleObj['backgroundColor'] !== undefined) {
    const backgroundColor = styleObj['backgroundColor']
    if (typeof backgroundColor === 'string' || typeof backgroundColor === 'number') {
      cssStyle.backgroundColor = String(backgroundColor) as CSSProperties['backgroundColor']
    }
  }

  if (styleObj['color'] !== undefined) {
    const color = styleObj['color']
    if (typeof color === 'string' || typeof color === 'number') {
      cssStyle.color = String(color) as CSSProperties['color']
    }
  }

  if (styleObj['height'] !== undefined) {
    const height = styleObj['height']
    cssStyle.height = typeof height === 'number' ? `${height}px` : (height as CSSProperties['height'])
  }

  if (styleObj['width'] !== undefined) {
    const width = styleObj['width']
    cssStyle.width = typeof width === 'number' ? `${width}px` : (width as CSSProperties['width'])
  }

  return cssStyle
}

function resolveAnimatedValue(style: ResolvedAnimatedStyle): unknown {
  if (!style) {
    return {}
  }

  if (typeof style === 'function') {
    return style()
  }

  if (isAnimatedStyleReturn(style)) {
    return style.value
  }

  return style
}

function mergeAnimatedStyles(animatedStyle: AnimatedStyle | AnimatedStyle[] | CSSProperties): CSSProperties {
  const stylesArray = Array.isArray(animatedStyle) ? animatedStyle : [animatedStyle]
  return stylesArray.reduce<CSSProperties>((acc, current) => {
    const resolved = resolveAnimatedValue(current)
    const cssStyle = convertToCSSProperties(resolved)
    return { ...acc, ...cssStyle }
  }, {})
}

export function useAnimatedStyleValue(animatedStyle: AnimatedStyle | AnimatedStyle[] | CSSProperties | undefined): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(() =>
    animatedStyle ? mergeAnimatedStyles(animatedStyle) : {}
  )
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!animatedStyle) {
      setStyle({})
      return
    }

    const stylesArray = Array.isArray(animatedStyle) ? animatedStyle : [animatedStyle]
    const hasDynamicStyles = stylesArray.some((current) =>
      typeof current === 'function' || isAnimatedStyleReturn(current)
    )

    if (!hasDynamicStyles) {
      setStyle(mergeAnimatedStyles(animatedStyle))
      return
    }

    const updateStyle = () => {
      try {
        setStyle(mergeAnimatedStyles(animatedStyle))
      } catch {
        setStyle({})
      }
      rafRef.current = requestAnimationFrame(updateStyle)
    }

    if (typeof rafRef.current === 'number') {
      cancelAnimationFrame(rafRef.current)
    }
    rafRef.current = requestAnimationFrame(updateStyle)

    return () => {
      if (typeof rafRef.current === 'number') {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [animatedStyle])

  return style
}

export const AnimatedView = forwardRef<HTMLDivElement, AnimatedViewProps>(function AnimatedView(
  { children, style: animatedStyle, ...props },
  ref
) {
  const computedStyle = useAnimatedStyleValue(animatedStyle)

  return (
    <div ref={ref} style={computedStyle} {...props}>
      {children}
    </div>
  )
})

