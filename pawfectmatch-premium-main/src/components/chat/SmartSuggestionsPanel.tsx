import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkle, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { SmartSuggestion } from '@/lib/chat-types'

interface SmartSuggestionsPanelProps {
  onSelect: (suggestion: SmartSuggestion) => void
  onDismiss: () => void
}

export default function SmartSuggestionsPanel({ 
  onSelect, 
  onDismiss 
}: SmartSuggestionsPanelProps) {
  const [suggestions] = useState<SmartSuggestion[]>([
    { id: '1', category: 'suggestion', text: 'Tell me more about your pet!', icon: '🐾' },                                                                
    { id: '2', category: 'suggestion', text: 'Want to set up a playdate?', icon: '🎾' },
    { id: '3', category: 'question', text: 'What does your pet love to do?', icon: '❓' }                                                                           
  ])

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="px-4 pb-2"
    >
      <div className="glass-effect rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-semibold">Smart Suggestions</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X size={12} />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {suggestion.icon && <span>{suggestion.icon}</span>}
              <span>{suggestion.text}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
