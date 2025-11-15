'use client';

import React from 'react';
import { Lightning, CheckCircle, Clock, Sparkle, ChatCircle } from '@phosphor-icons/react';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

import { type DiscoveryPreferences } from '@/components/discovery-preferences';

interface AdvancedTabProps {
    draft: DiscoveryPreferences;
    onDraftChange(next: DiscoveryPreferences): void;
}

export function DiscoveryFiltersAdvancedTab({ draft, onDraftChange }: AdvancedTabProps) {
    const { advancedFilters } = draft;

    const setAdvancedFilters = (
        patch: Partial<DiscoveryPreferences['advancedFilters']>,
    ) => {
        onDraftChange({
            ...draft,
            advancedFilters: {
                ...draft.advancedFilters,
                ...patch,
            },
        });
    };

    return (
        <ScrollArea className="-mx-6 h-full px-6">
            <div className="space-y-4 py-2">
                <div>
                    <Label className="mb-4 flex items-center gap-2 text-base font-semibold">
                        <Lightning size={18} weight="bold" />
                        Enhanced Filters
                    </Label>
                    <p className="mb-4 text-xs text-muted-foreground">
                        Find the most active and responsive matches
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} weight="duotone" className="text-primary" />
                                <div>
                                    <div className="text-sm font-medium">Verified Profiles</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        ID or photo verified accounts
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={advancedFilters.verified}
                                onCheckedChange={(checked) => setAdvancedFilters({ verified: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3">
                                <Clock size={20} weight="duotone" className="text-secondary" />
                                <div>
                                    <div className="text-sm font-medium">Active Today</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        Online in the last 24 hours
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={advancedFilters.activeToday}
                                onCheckedChange={(checked) =>
                                    setAdvancedFilters({ activeToday: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3">
                                <Sparkle size={20} weight="duotone" className="text-accent" />
                                <div>
                                    <div className="text-sm font_medium">Has Stories</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        Posted stories recently
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={advancedFilters.hasStories}
                                onCheckedChange={(checked) =>
                                    setAdvancedFilters({ hasStories: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3">
                                <ChatCircle size={20} weight="duotone" className="text-primary" />
                                <div>
                                    <div className="text-sm font-medium">Responds Quickly</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        Average response under 1 hour
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={advancedFilters.respondQuickly}
                                onCheckedChange={(checked) =>
                                    setAdvancedFilters({ respondQuickly: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3">
                                <Lightning size={20} weight="duotone" className="text-accent" />
                                <div>
                                    <div className="text-sm font-medium">Super Likes Only</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        Show only profiles that super liked you
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={advancedFilters.superLikesOnly}
                                onCheckedChange={(checked) =>
                                    setAdvancedFilters({ superLikesOnly: checked })
                                }
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="rounded-lg border border-accent/20 bg-accent/10 p-4">
                    <div className="flex items-start gap-3">
                        <Sparkle
                            size={20}
                            weight="duotone"
                            className="mt-0.5 shrink-0 text-accent"
                        />
                        <div>
                            <div className="mb-1 text-sm font-medium">
                                Premium Filters Active
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Advanced filters help you find the most compatible and active matches.
                                Some filters may reduce the number of available profiles.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
