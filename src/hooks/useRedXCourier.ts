import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RedXParcel {
  customer_name: string;
  customer_phone: string;
  delivery_area: string;
  customer_address: string;
  merchant_invoice_id: string;
  cash_collection_amount: number;
  parcel_weight?: number;
  instruction?: string;
  order_type?: number;
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

export function useRedXCourier() {
  const [loading, setLoading] = useState(false);

  const callRedX = async (action: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    try {
      return await callWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('redx-courier', {
          body: { action, ...payload },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      });
    } catch (error: unknown) {
      console.error('RedX API error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`RedX: ${msg}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    return await callRedX('test_connection');
  };

  const getAreas = async () => {
    const result = await callRedX('get_areas');
    return result?.result || result?.data || result || [];
  };

  const createParcel = async (parcel: RedXParcel) => {
    const result = await callRedX('create_parcel', { parcel });
    if (result?.result?.tracking_id || result?.tracking_id) {
      toast.success('RedX parcel created successfully');
    }
    return result;
  };

  const trackParcel = async (tracking_id: string) => {
    return await callRedX('track_parcel', { tracking_id });
  };

  const getParcelDetails = async (tracking_id: string) => {
    return await callRedX('get_parcel_details', { tracking_id });
  };

  const cancelParcel = async (tracking_id: string) => {
    const result = await callRedX('cancel_parcel', { tracking_id });
    toast.success('Parcel cancelled');
    return result;
  };

  return {
    loading,
    testConnection,
    getAreas,
    createParcel,
    trackParcel,
    getParcelDetails,
    cancelParcel,
  };
}
