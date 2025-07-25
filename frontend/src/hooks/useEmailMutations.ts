// src/hooks/useEmailMutations.ts
import { updateEmailLabels } from "@/api/emailsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useEmailMutations = (listQueryKey: any[]) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateEmailLabels,

    onMutate: async (payload) => {
      const { emailId } = payload;
      console.log(emailId);
      const detailQueryKey = ["email", emailId];

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      // Snapshot the previous values
      const previousListData = queryClient.getQueryData(listQueryKey);
      const previousDetailData = queryClient.getQueryData(detailQueryKey);

      // Optimistically update the list query cache
      if (previousListData) {
        queryClient.setQueryData(listQueryKey, (oldData: any) => {
          const newPages = oldData.pages.map((page) => ({
            ...page,
            emails: page.emails.map((email) => {
              if (email.id === emailId) {
                const currentLabels = new Set(email.label_ids || []);
                payload.addLabelIds?.forEach((label) =>
                  currentLabels.add(label)
                );
                payload.removeLabelIds?.forEach((label) =>
                  currentLabels.delete(label)
                );
                const newLabelIds = Array.from(currentLabels);

                return {
                  ...email,
                  label_ids: newLabelIds,
                  is_starred: newLabelIds.includes("STARRED"),
                  is_unread: newLabelIds.includes("UNREAD"),
                };
              }
              return email;
            }),
          }));
          return { ...oldData, pages: newPages };
        });
      }

      // --- Optimistically update the detail query cache (if it exists)
      if (previousDetailData) {
        queryClient.setQueryData(detailQueryKey, (oldEmailData: any) => {
          const currentLabels = new Set(oldEmailData.label_ids || []);
          payload.addLabelIds?.forEach((label) => currentLabels.add(label));
          payload.removeLabelIds?.forEach((label) =>
            currentLabels.delete(label)
          );
          const newLabelIds = Array.from(currentLabels);

          return {
            ...oldEmailData,
            label_ids: newLabelIds,
            is_starred: newLabelIds.includes("STARRED"),
            is_unread: newLabelIds.includes("UNREAD"),
          };
        });
      }

      // Return a context object with both snapshotted values
      return { previousListData, previousDetailData, detailQueryKey };
    },
    // If the mutation fails, roll back both caches
    onError: (err, payload, context) => {
      console.error("Mutation failed:", err);
      if (context?.previousListData) {
        queryClient.setQueryData(listQueryKey, context.previousListData);
      }
      if (context?.previousDetailData) {
        queryClient.setQueryData(
          context.detailQueryKey,
          context.previousDetailData
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      queryClient.invalidateQueries({ queryKey: ["email", variables.emailId] });
    },
  });

  const toggleStarred = (email: any) => {
    mutation.mutate({
      emailId: email.id,
      addLabelIds: email.is_starred ? [] : ["STARRED"],
      removeLabelIds: email.is_starred ? ["STARRED"] : [],
    });
  };

  const toggleUnread = (email: any) => {
    mutation.mutate({
      emailId: email.id,
      addLabelIds: email.is_unread ? [] : ["UNREAD"],
      removeLabelIds: email.is_unread ? ["UNREAD"] : [],
    });
  };

  const archiveEmail = (email: any) => {
    mutation.mutate({
      emailId: email.id,
      removeLabelIds: ["INBOX"],
    });
  };

  return { ...mutation, toggleStarred, toggleUnread, archiveEmail };
};
