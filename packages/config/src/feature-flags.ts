import { z } from 'zod'

const FlagsSchema = z.object({
  chat: z.object({
    confetti: z.boolean(),
    reactionBurst: z.boolean(),
    auroraRing: z.boolean(),
    virtualization: z.boolean(),
  }),
})

export type Flags = z.infer<typeof FlagsSchema>

let FLAGS: Flags = {
  chat: {
    confetti: true,
    reactionBurst: true,
    auroraRing: true,
    virtualization: true,
  },
}

export function loadFlags(json: unknown): void {
  FLAGS = FlagsSchema.parse(json)
}

export function flags(): Flags {
  return FLAGS
}

