import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    subtitleValue?: string | number;
    icon: LucideIcon;
    iconColor: string;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
}

export function StatCard({
    title,
    value,
    subtitle,
    subtitleValue,
    icon: Icon,
    iconColor,
    trend,
    loading
}: StatCardProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-14" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground">{subtitle}</span>
                            {subtitleValue !== undefined && (
                                <span className={
                                    trend === 'up' ? 'text-emerald-600 font-semibold' :
                                        trend === 'down' ? 'text-red-600 font-semibold' :
                                            'text-muted-foreground font-semibold'
                                }>
                                    {subtitleValue}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
