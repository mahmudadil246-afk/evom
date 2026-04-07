import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaperflyParcel {
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  customer_invoice: string;
  cash_collection: number;
  special_instruction?: string;
  parcel_weight?: number;
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Unreachable');
}

export function usePaperflyCourier() {
  const [loading, setLoading] = useState(false);

  const callPaperfly = async (action: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    try {
      return await callWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('paperfly-courier', {
          body: { action, ...payload },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      });
    } catch (error: unknown) {
      console.error('Paperfly API error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Paperfly: ${msg}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    return await callPaperfly('test_connection');
  };

  const createParcel = async (parcel: PaperflyParcel) => {
    const result = await callPaperfly('create_parcel', { parcel });
    if (result?.tracking_code || result?.data?.tracking_code) {
      toast.success('Paperfly parcel created successfully');
    }
    return result;
  };

  const trackParcel = async (tracking_code: string) => {
    return await callPaperfly('track_parcel', { tracking_code });
  };

  const getParcelDetails = async (tracking_code: string) => {
    return await callPaperfly('get_parcel_details', { tracking_code });
  };

  const cancelParcel = async (tracking_code: string) => {
    const result = await callPaperfly('cancel_parcel', { tracking_code });
    toast.success('Parcel cancelled');
    return result;
  };

  const bulkCreateParcels = async (parcels: PaperflyParcel[]) => {
    const result = await callPaperfly('bulk_create_parcels', { parcels });
    toast.success(`${parcels.length} parcels created`);
    return result;
  };

  return {
    loading,
    testConnection,
    createParcel,
    trackParcel,
    getParcelDetails,
    cancelParcel,
    bulkCreateParcels,
  };
}
