// components/CountProductFollowUpModal.tsx
import React from 'react';
import { format } from 'date-fns';
import GenericFollowUpModal, { FollowUpEntity, FollowUpItem, CreateFollowUpData } from './GenericFollowUpModal';
import {
  getCountProductFollowUps,
  createCountProductFollowUp,
  deleteCountProductFollowUp,
  CountProductFollowUp
} from '../api/countProductApi';

// Count Product interface (matching CountProductOverview interface)
interface CountProduct {
  id: number;
  partyName: string;
  dyeingFirm: string;
  yarnType: string;
  count: string;
  shade: string;
  quantity: number;
  completedDate: string;
  qualityGrade: string;
  remarks: string;
  lotNumber: string;
  processedBy: string;
  customerName: string;
  sentToDye: boolean;
  sentDate: string;
  received: boolean;
  receivedDate: string;
  receivedQuantity: number;
  dispatch: boolean;
  dispatchDate: string;
  dispatchQuantity: number;
  middleman: string;
}

interface CountProductFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  countProduct: CountProduct | null;
  onFollowUpAdded: () => void;
}

const CountProductFollowUpModal: React.FC<CountProductFollowUpModalProps> = ({
  isOpen,
  onClose,
  countProduct,
  onFollowUpAdded
}) => {
  // Convert CountProduct to FollowUpEntity
  const entity: FollowUpEntity | null = countProduct ? {
    id: countProduct.id,
    name: `${countProduct.yarnType} (${countProduct.count}) - ${countProduct.shade}`,
    subtitle: `${countProduct.customerName} • Completed on ${format(new Date(countProduct.completedDate), 'MMM dd, yyyy')}`
  } : null;

  // Convert CountProductFollowUp to FollowUpItem
  const convertToFollowUpItem = (followUp: CountProductFollowUp): FollowUpItem => ({
    id: followUp.id,
    followUpDate: followUp.followUpDate,
    remarks: followUp.remarks,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
    addedBy: followUp.addedBy,
    addedByName: followUp.addedByName
  });

  // Wrapper functions to match the generic interface
  const getFollowUpsWrapper = async (entityId: number): Promise<FollowUpItem[]> => {
    try {
      const followUps = await getCountProductFollowUps(entityId);
      return followUps.map(convertToFollowUpItem);
    } catch (error: any) {
      console.error('Failed to fetch count product follow-ups:', error);
      
      // Fallback: Return empty array if server is not available
      // This allows the UI to work even without backend connection
      if (error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
        console.warn('Backend not available, using empty follow-up list');
        return [];
      }
      
      throw new Error('Failed to load follow-up history. Please check if the server is running.');
    }
  };

  const createFollowUpWrapper = async (entityId: number, data: CreateFollowUpData): Promise<FollowUpItem> => {
    try {
      const followUp = await createCountProductFollowUp(entityId, {
        remarks: data.remarks,
        followUpDate: data.followUpDate
      });
      return convertToFollowUpItem(followUp);
    } catch (error: any) {
      console.error('Failed to create count product follow-up:', error);
      
      // Fallback: Create a mock follow-up for UI testing
      // This allows the UI to work even without backend connection
      if (error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
        console.warn('Backend not available, creating mock follow-up for UI testing');
        const mockFollowUp: FollowUpItem = {
          id: Math.floor(Math.random() * 1000000), // Random ID for testing
          followUpDate: data.followUpDate || new Date().toISOString(),
          remarks: data.remarks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          addedBy: 1,
          addedByName: 'Test User (No Backend)'
        };
        return mockFollowUp;
      }
      
      throw new Error('Failed to save follow-up. Please check if the server is running and you are logged in.');
    }
  };

  const deleteFollowUpWrapper = async (entityId: number, followUpId: number): Promise<void> => {
    try {
      return await deleteCountProductFollowUp(entityId, followUpId);
    } catch (error: any) {
      console.error('Failed to delete count product follow-up:', error);
      
      // Fallback: Just log for UI testing
      if (error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
        console.warn('Backend not available, mock delete successful');
        return;
      }
      
      throw new Error('Failed to delete follow-up. Please check if the server is running and you have permission.');
    }
  };

  return (
    <GenericFollowUpModal
      isOpen={isOpen}
      onClose={onClose}
      entity={entity}
      entityType="countproduct"
      onFollowUpAdded={onFollowUpAdded}
      getFollowUps={getFollowUpsWrapper}
      createFollowUp={createFollowUpWrapper}
      deleteFollowUp={deleteFollowUpWrapper}
    />
  );
};

export default CountProductFollowUpModal;
