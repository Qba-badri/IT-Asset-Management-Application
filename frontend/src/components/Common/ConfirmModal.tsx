import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'primary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    show,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    return (
        <Dialog open={show} onOpenChange={(open) => { if (!open) onCancel(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <div className={cn(
                        'mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full',
                        type === 'danger' && 'bg-destructive/10',
                        type === 'warning' && 'bg-amber-100',
                        type === 'primary' && 'bg-primary/10',
                    )}>
                        <AlertTriangle className={cn(
                            'h-6 w-6',
                            type === 'danger' && 'text-destructive',
                            type === 'warning' && 'text-amber-600',
                            type === 'primary' && 'text-primary',
                        )} />
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-left whitespace-pre-line">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={type === 'danger' ? 'destructive' : type === 'warning' ? 'warning' : 'default'}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmModal;
