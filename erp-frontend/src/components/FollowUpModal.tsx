// components/FollowUpModal.tsx
import React from 'react';
import { format } from 'date-fns';
import { DyeingRecord } from '../types/dyeing';
import {
  getFollowUpsByRecordId,
  createFollowUp,
  deleteFollowUp
} from '../api/dyeingApi';
import GenericFollowUpModal, { FollowUpEntity, FollowUpItem, CreateFollowUpData } from './GenericFollowUpModal';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  dyeingRecord: DyeingRecord | null;
  onFollowUpAdded: () => void;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  dyeingRecord,
  onFollowUpAdded
}) => {
  // Convert DyeingRecord to FollowUpEntity
  const entity: FollowUpEntity | null = dyeingRecord ? {
    id: dyeingRecord.id,
    name: dyeingRecord.yarnType,
    subtitle: `Sent on ${format(new Date(dyeingRecord.sentDate), 'MMM dd, yyyy')}`
  } : null;

  // Wrapper functions to match the generic interface
  const getFollowUpsWrapper = async (entityId: number): Promise<FollowUpItem[]> => {
    return await getFollowUpsByRecordId(entityId);
  };

  const createFollowUpWrapper = async (entityId: number, data: CreateFollowUpData): Promise<FollowUpItem> => {
    return await createFollowUp(entityId, data);
  };

  const deleteFollowUpWrapper = async (entityId: number, followUpId: number): Promise<void> => {
    return await deleteFollowUp(entityId, followUpId);
  };

  return (
    <GenericFollowUpModal
      isOpen={isOpen}
      onClose={onClose}
      entity={entity}
      entityType="dyeing"
      onFollowUpAdded={onFollowUpAdded}
      getFollowUps={getFollowUpsWrapper}
      createFollowUp={createFollowUpWrapper}
      deleteFollowUp={deleteFollowUpWrapper}
    />
  );
};

export default FollowUpModal;
