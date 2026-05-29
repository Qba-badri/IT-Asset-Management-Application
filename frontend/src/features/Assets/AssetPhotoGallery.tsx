import React, { useState, useRef } from 'react';
import { ImageIcon, Camera, Calendar, FileText, ZoomIn, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';


export interface AssetPhoto {
    id: number; url: string; filename: string; uploadedAt: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    notes?: string; size: number;
}

interface AssetPhotoGalleryProps {
    assetId: number; assetName: string; photos: AssetPhoto[];
    onPhotoUpload: (files: FileList) => void; onPhotoDelete: (photoId: number) => void;
    readonly?: boolean;
}

const AssetPhotoGallery: React.FC<AssetPhotoGalleryProps> = ({ assetId, assetName, photos, onPhotoUpload, onPhotoDelete, readonly = false }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<AssetPhoto | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getConditionVariant = (condition: string): any => {
        const map: Record<string, any> = { excellent: 'success', good: 'info', fair: 'warning', poor: 'warning', damaged: 'destructive' };
        return map[condition] || 'outline';
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) { onPhotoUpload(e.target.files); e.target.value = ''; }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <CardTitle>Asset Photo Gallery</CardTitle>
                    <Badge variant="muted">{photos.length} photo{photos.length !== 1 ? 's' : ''}</Badge>
                </div>
                {!readonly && (
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4 mr-1" />Upload Photos
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {photos.length === 0 ? (
                    <div className="text-center py-8">
                        <Camera className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <h4 className="font-medium text-muted-foreground">No photos uploaded</h4>
                        <p className="text-sm text-muted-foreground mb-3">Upload photos to track the visual condition of this asset</p>
                        {!readonly && <Button onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-4 w-4 mr-1" />Upload Photos</Button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo) => (
                            <div key={photo.id} className="group relative rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                                <div className="relative aspect-square overflow-hidden">
                                    <img src={photo.url} alt={`${assetName} condition`}
                                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                        onClick={() => setSelectedPhoto(photo)}
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="50%25" dx="50%25" text-anchor="middle"%3EImage Not Found%3C/text%3E%3C/svg%3E'; }}
                                    />
                                    <div className="absolute top-2 right-2"><Badge variant={getConditionVariant(photo.condition)} className="text-xs">{photo.condition}</Badge></div>
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}><ZoomIn className="h-3.5 w-3.5" /></Button>
                                            {!readonly && <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-white hover:bg-red-500/60" onClick={(e) => { e.stopPropagation(); onPhotoDelete(photo.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs font-medium truncate" title={photo.filename}>{photo.filename}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-muted-foreground">{formatFileSize(photo.size)}</span>
                                        {photo.notes && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Asset Photo Details</DialogTitle></DialogHeader>
                    {selectedPhoto && (
                        <>
                            <img src={selectedPhoto.url} alt={`${assetName} condition`} className="w-full max-h-[60vh] object-contain rounded" />
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><strong>Condition:</strong> <Badge variant={getConditionVariant(selectedPhoto.condition)} className="ml-1">{selectedPhoto.condition}</Badge></div>
                                <div><strong>Uploaded:</strong> <span className="ml-1">{new Date(selectedPhoto.uploadedAt).toLocaleString()}</span></div>
                                <div><strong>File:</strong> <span className="ml-1">{selectedPhoto.filename}</span></div>
                                <div><strong>Size:</strong> <span className="ml-1">{formatFileSize(selectedPhoto.size)}</span></div>
                                {selectedPhoto.notes && <div className="col-span-2"><strong>Notes:</strong><p className="mt-1 text-muted-foreground">{selectedPhoto.notes}</p></div>}
                            </div>
                        </>
                    )}
                    <DialogFooter>
                        {!readonly && selectedPhoto && <Button variant="destructive" onClick={() => { onPhotoDelete(selectedPhoto.id); setSelectedPhoto(null); }}><Trash2 className="h-4 w-4 mr-1" />Delete Photo</Button>}
                        <Button variant="outline" onClick={() => setSelectedPhoto(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AssetPhotoGallery;
