import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '../api/listings';
import { QUERY_KEYS } from '../constants/queryKeys';

export const useImageUpload = (listingId: number) => {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => listingsApi.uploadImages(listingId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.MY_LISTINGS });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageIndex: number) => listingsApi.deleteImage(listingId, imageIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.MY_LISTINGS });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (imageOrder: number[]) => listingsApi.reorderImages(listingId, imageOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.MY_LISTINGS });
    },
  });

  return {
    uploadImages: uploadMutation.mutateAsync,
    deleteImage: deleteMutation.mutateAsync,
    reorderImages: reorderMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
    uploadError: uploadMutation.error,
    deleteError: deleteMutation.error,
    reorderError: reorderMutation.error,
  };
}; 