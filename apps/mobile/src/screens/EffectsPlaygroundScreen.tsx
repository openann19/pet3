/**
 * Effects Playground Screen
 *
 * Interactive demo for all three Skia effects with timing controls.
 * Allows real-time tweaking of animation parameters.
 *
 * Location: apps/mobile/src/screens/EffectsPlaygroundScreen.tsx
 */

import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { EffectCard } from '@mobile/components/effects/EffectCard'
import { useEffectsPlayground } from '@mobile/hooks/effects/useEffectsPlayground'
import { AdditiveBloom } from '@mobile/effects/chat/shaders/additive-bloom'
import { ChromaticAberrationFX } from '@mobile/effects/chat/shaders/chromatic-aberration'
import { RibbonFX } from '@mobile/effects/chat/shaders/ribbon-fx'
import { colors } from '@mobile/theme/colors'
import { typography, spacing, radius, component } from '@mobile/theme/tokens'
import React from 'react'
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function EffectsPlaygroundScreen(): React.ReactElement {
  const {
    reducedMotion,
    setReducedMotion,
    sendWarp,
    mediaZoom,
    swipeReply,
    handleSendWarp,
    handleMediaZoom,
    handleMediaClose,
    handleReset,
    handleAnimateRibbon,
    canvasWidth,
    canvasHeight,
  } = useEffectsPlayground()

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Effects Playground"
          description="Interactive demos for Skia effects with timing controls."
        />

        {/* Reduced Motion Toggle */}
        <FeatureCard title="Settings" subtitle="Accessibility">
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Reduced Motion</Text>
            <Switch
              value={reducedMotion}
              onValueChange={setReducedMotion}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </FeatureCard>

        {/* Send Warp Section */}
        <EffectCard title="Send Warp" subtitle="AdditiveBloom glow trail">
          <View style={styles.canvasWrapper}>
            <AdditiveBloom
              width={canvasWidth}
              height={canvasHeight}
              centerX={sendWarp.bloomCenterX}
              centerY={sendWarp.bloomCenterY}
              radius={sendWarp.bloomRadius}
              intensity={sendWarp.bloomIntensity}
              color={[0.3, 0.75, 1]}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendWarp}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Trigger send warp effect"
          >
            <Text style={styles.buttonText}>Trigger Send</Text>
          </TouchableOpacity>
        </EffectCard>

        {/* Media Zoom Section */}
        <EffectCard title="Media Zoom" subtitle="ChromaticAberrationFX on open">
          <View style={styles.canvasWrapper}>
            <ChromaticAberrationFX
              uri="https://via.placeholder.com/300x200"
              width={canvasWidth}
              height={canvasHeight}
              center={mediaZoom.aberrationCenter}
              radius={mediaZoom.aberrationRadius}
              intensity={mediaZoom.aberrationIntensity}
              borderRadius={radius.lg}
            />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleMediaZoom}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open media zoom"
            >
              <Text style={styles.buttonText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleMediaClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close media zoom"
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </EffectCard>

        {/* Reply Ribbon Section */}
        <EffectCard title="Reply Ribbon" subtitle="RibbonFX for swipe-to-reply">
          <View style={styles.canvasWrapper}>
            <RibbonFX
              width={canvasWidth}
              height={canvasHeight}
              p0={swipeReply.ribbonP0}
              p1={swipeReply.ribbonP1}
              thickness={swipeReply.ribbonThickness}
              glow={swipeReply.ribbonGlow}
              progress={swipeReply.ribbonProgress}
              color={[0.2, 0.8, 1.0]}
              alpha={swipeReply.ribbonAlpha}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAnimateRibbon}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Animate ribbon effect"
          >
            <Text style={styles.buttonText}>Animate Ribbon</Text>
          </TouchableOpacity>
        </EffectCard>

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Reset all effects"
        >
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

EffectsPlaygroundScreen.displayName = 'EffectsPlaygroundScreen'

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  canvasWrapper: {
    width: 300,
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    minHeight: component.touchTargetMin,
    minWidth: component.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  resetButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.md,
    marginTop: spacing.xl,
    minHeight: component.touchTargetMin,
    minWidth: component.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  resetButtonText: {
    color: colors.textPrimary,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
})
