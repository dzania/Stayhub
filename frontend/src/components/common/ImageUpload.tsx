import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  disabled?: boolean;
  showPreview?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
  showPreview = true,
}) => {
  const [uploadError, setUploadError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadError('');

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((file) => {
          if (file.errors) {
            return file.errors.map((error: any) => error.message).join(', ');
          }
          return 'Invalid file';
        });
        setUploadError(`Some files were rejected: ${errors.join('; ')}`);
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const remainingSlots = maxImages - images.length;
        const filesToAdd = acceptedFiles.slice(0, remainingSlots);

        if (acceptedFiles.length > remainingSlots) {
          setUploadError(
            `Only ${remainingSlots} more images can be added (max ${maxImages} total)`
          );
        }

        const newImages: ImageFile[] = filesToAdd.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        onImagesChange([...images, ...newImages]);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    disabled: disabled || images.length >= maxImages,
    multiple: true,
  });

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find((img) => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter((img) => img.id !== imageId));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Area */}
      {images.length < maxImages && (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'transparent',
            transition: 'all 0.2s ease',
            mb: 2,
            '&:hover': {
              borderColor: disabled ? 'grey.300' : 'primary.main',
              backgroundColor: disabled ? 'transparent' : 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to select files
          </Typography>
          <Button variant="outlined" disabled={disabled}>
            Choose Images
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Max {maxImages} images • Up to {maxFileSize}MB each • {acceptedFormats.join(', ')}
          </Typography>
        </Box>
      )}

      {/* Error Display */}
      {uploadError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
          {uploadError}
        </Alert>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            Images ({images.length}/{maxImages})
          </Typography>
          {images.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              First image will be the main photo
            </Typography>
          )}
        </Box>
      )}

      {/* Image Previews */}
      {showPreview && images.length > 0 && (
        <Grid container spacing={2}>
          {images.map((image, index) => (
            <Grid item xs={6} sm={4} md={3} key={image.id}>
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={image.preview}
                  alt={`Upload ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                />
                
                {/* Main Photo Indicator */}
                {index === 0 && (
                  <Chip
                    label="Main"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontSize: '0.7rem',
                    }}
                  />
                )}

                {/* Controls */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  {/* Move Controls */}
                  {images.length > 1 && (
                    <>
                      {index > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => moveImage(index, index - 1)}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                          }}
                        >
                          <DragIcon fontSize="small" />
                        </IconButton>
                      )}
                    </>
                  )}

                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    onClick={() => removeImage(image.id)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: 'error.main',
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: 'error.dark',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* File Info */}
                <Box sx={{ p: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {image.file.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'grey.300' }}>
                    {formatFileSize(image.file.size)}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Total size: {formatFileSize(images.reduce((sum, img) => sum + img.file.size, 0))}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ImageUpload; 