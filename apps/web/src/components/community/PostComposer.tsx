import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { communityAPI } from '@/api/community-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Camera, VideoCamera, Tag, X, Sparkle } from 'phosphor-react';
// Add other icons/components as needed
// Dummy ImagePreviewItem
const ImagePreviewItem = ({ img, index, onRemove }: { img: any; index: number; onRemove: () => void }) => (
  <div className="relative">
    <img src={img.url} alt="Preview" className="rounded-lg w-full h-auto" />
    <button onClick={onRemove} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1" aria-label="Remove image">
      <X size={16} />
    </button>
  </div>
);
  // State variables and hooks
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [videoState, setVideoState] = useState<any>({ previewUrl: '', isCompressing: false });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [cropSize, setCropSize] = useState('original');
  const [userPets, setUserPets] = useState<any[]>([]);
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const MAX_CHARS = 500;
  const MAX_IMAGES = 5;
  const remainingChars = MAX_CHARS - text.length;
  const visibilityOptions = [
    { value: 'public', icon: Camera, label: 'Public' },
    { value: 'friends', icon: VideoCamera, label: 'Friends' },
    { value: 'private', icon: Tag, label: 'Private' },
  ];
  // Dummy translation object
  const t = {
    community: {
      createPost: 'Create Post',
      postPlaceholder: "Share what's on your mind...",
      charsRemaining: 'characters remaining',
      tagPets: 'Tag Your Pets',
      tags: 'Tags',
      addTag: 'Add tag...',
      visibility: 'Visibility',
    },
    common: {
      cancel: 'Cancel',
      posting: 'Posting...',
      post: 'Post',
    },
  };
  // Dummy haptics
  const haptics = { selection: () => {} };
  // Dummy handlers
  const handleRemoveImage = (index: number) => {};
  const handleAddTag = () => {};
  const handleRemoveTag = (tag: string) => {};
  const handleSubmit = () => {};
  const onOpenChange = (val: boolean) => setOpen(val);
  const handleVideoUploadClick = () => {};
export const PostComposer = () => {
  // State and handlers as above
  // ...
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" className="hidden" />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t.community?.createPost || 'Create Post'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Text Area */}
          <div>
            <Textarea
              placeholder={t.community?.postPlaceholder || "Share what's on your mind..."}
              value={text}
              onChange={e => setText(e.target.value)}
              className="min-h-30 resize-none text-base"
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${remainingChars < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {remainingChars} {t.community?.charsRemaining || 'characters remaining'}
              </span>
            </div>
          </div>
          {/* Image Preview */}
          {images.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Photos ({images.length}/{MAX_IMAGES})
                </Label>
                <Badge variant="outline" className="text-xs capitalize">
                  {cropSize}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <ImagePreviewItem key={index} img={img} index={index} onRemove={() => handleRemoveImage(index)} />
                ))}
              </div>
            </motion.div>
          )}
          {/* Video Preview */}
          {videoState.previewUrl && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <VideoCamera size={16} weight="bold" />
                  Video Preview
                </Label>
                {/* Metadata badges can go here */}
              </div>
              {/* Video controls and error/loading UI can go here */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black group">
                <video ref={videoPreviewRef} src={videoState.previewUrl} className="w-full h-full object-contain" onPlay={() => setIsVideoPlaying(true)} onPause={() => setIsVideoPlaying(false)} onEnded={() => setIsVideoPlaying(false)} loop />
                <motion.button onClick={() => setIsVideoPlaying(!isVideoPlaying)} className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={isVideoPlaying ? 'Pause video' : 'Play video'} type="button" />
                <button onClick={() => setVideoState({ ...videoState, previewUrl: '' })} className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity" disabled={videoState.isCompressing} aria-label="Remove video" type="button">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
          {/* Tag pets */}
          {userPets && userPets.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.community?.tagPets || 'Tag Your Pets'}
              </label>
              <div className="flex flex-wrap gap-2">
                {userPets.map((pet) => {
                  const isSelected = selectedPets.includes(pet.id);
                  return (
                    <Badge
                      key={pet.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedPets((prev) =>
                          isSelected ? prev.filter((id) => id !== pet.id) : [...prev, pet.id]
                        );
                        haptics.selection();
                      }}
                    >
                      {pet.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t.community?.tags || 'Tags'} ({tags.length}/10)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder={t.community?.addTag || 'Add tag...'}
                className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
              />
              <Button onClick={handleAddTag} variant="outline" size="sm">
                <Tag size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button 
                      onClick={() => handleRemoveTag(tag)} 
                      className="hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" 
                      aria-label="Remove tag"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {/* Visibility */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t.community?.visibility || 'Visibility'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {visibilityOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setVisibility(value);
                    haptics.selection();
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${visibility === value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <Icon
                    size={24}
                    className="mx-auto mb-1"
                    weight={visibility === value ? 'fill' : 'regular'}
                  />
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowMediaOptions(!showMediaOptions); }}
              className="gap-2"
            >
              {showMediaOptions ? (
                <>
                  <X size={18} />
                  Close
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Media
                </>
              )}
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={!canPost}>
              {isSubmitting ? t.common?.posting || 'Posting...' : t.common?.post || 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// ...existing code...
