import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { CreditCard, Truck, Mail, ChevronLeft, ShieldCheck, Tag, X, Smartphone, MapPin, Loader2, Building, Save, Clock, Sparkles, Building2, AlertCircle, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { SEOHead } from "@/components/SEOHead";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCoupon } from "@/hooks/useCoupon";
import { useShippingData } from "@/hooks/useShippingData";
import { useEnabledPaymentMethods } from "@/hooks/useEnabledPaymentMethods";
import { useAutoDiscountRules } from "@/hooks/useAutoDiscountRules";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ManualPaymentInstructions } from "@/components/checkout/ManualPaymentInstructions";
import { BankTransferInstructions } from "@/components/checkout/BankTransferInstructions";
import { SavedAddressSelector } from "@/components/checkout/SavedAddressSelector";
import { CheckoutSteps } from "@/components/store/CheckoutSteps";
import { GiftOptions } from "@/components/checkout/GiftOptions";
import { OrderReviewModal } from "@/components/checkout/OrderReviewModal";
import { CheckoutContactSection } from "@/components/checkout/CheckoutContactSection";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { formatPrice } from "@/lib/formatPrice";

interface CouponState {
  couponId?: string;
  couponCode?: string;
  discountAmount?: number;
  autoDiscount?: number;
  autoDiscountRuleName?: string;
}

interface SavedAddress {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  street_address: string;
  area: string | null;
  city: string;
  postal_code: string | null;
  is_default: boolean | null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: allItems, selectedItems, selectedSubtotal, subtotal: cartSubtotal, clearCart, markCartRecovered, removeSelectedItems } = useCart();
  const items = selectedItems.length > 0 ? selectedItems : allItems;
  const subtotal = selectedItems.length > 0 ? selectedSubtotal : cartSubtotal;
  const { user } = useAuth();
  const { t } = useLanguage();
  const { appliedCoupon, validateCoupon, removeCoupon, incrementCouponUsage, loading: couponLoading } = useCoupon();
  const { zonesWithRates, loading: shippingLoading } = useShippingData();
  const { paymentMethods: enabledPaymentMethods, loading: paymentMethodsLoading } = useEnabledPaymentMethods();

  const [couponCode, setCouponCode] = useState("");
  const couponState = location.state as CouponState | undefined;

  useEffect(() => {
    if (couponState?.couponCode && !appliedCoupon) {
      validateCoupon(couponState.couponCode, subtotal);
    }
  }, []);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [transactionId, setTransactionId] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [useSavedShippingAddress, setUseSavedShippingAddress] = useState(true);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<SavedAddress | null>(null);
  
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<SavedAddress | null>(null);
  const [useSavedBillingAddress, setUseSavedBillingAddress] = useState(true);
  const [hasBillingAddresses, setHasBillingAddresses] = useState(false);
  
  const [saveShippingAddress, setSaveShippingAddress] = useState(false);
  const [shippingAddressLabel, setShippingAddressLabel] = useState("Home");
  
  const [saveBillingAddress, setSaveBillingAddress] = useState(false);
  const [billingAddressLabel, setBillingAddressLabel] = useState("Office");
  const [billingFormData, setBillingFormData] = useState({
    firstName: "", lastName: "", phone: "", address: "", city: "", postalCode: "",
  });

  // Gift options
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [hidePricing, setHidePricing] = useState(false);

  // Terms & conditions
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Order review modal
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Checkout step tracking (visual only)
  const currentStep = useMemo(() => {
    if (!formData.email) return 0;
    if (!formData.firstName || !formData.phone || !formData.address || !formData.city) return 0;
    if (!selectedZoneId || !selectedRateId) return 1;
    if (!paymentMethod) return 2;
    return 3;
  }, [formData, selectedZoneId, selectedRateId, paymentMethod]);

  const selectedZone = useMemo(() => zonesWithRates.find(z => z.id === selectedZoneId), [zonesWithRates, selectedZoneId]);
  const availableRates = useMemo(() => selectedZone?.rates?.filter(r => r.is_active) || [], [selectedZone]);
  const selectedRate = useMemo(() => availableRates.find(r => r.id === selectedRateId), [availableRates, selectedRateId]);

  const shippingCost = useMemo(() => {
    if (!selectedRate) return 0;
    if (selectedRate.max_order_amount && subtotal >= selectedRate.max_order_amount) return 0;
    return selectedRate.rate;
  }, [selectedRate, subtotal]);

  useEffect(() => {
    if (availableRates.length > 0 && !selectedRateId) {
      setSelectedRateId(availableRates[0].id);
    } else if (availableRates.length > 0 && !availableRates.find(r => r.id === selectedRateId)) {
      setSelectedRateId(availableRates[0].id);
    }
  }, [availableRates, selectedRateId]);

  useEffect(() => {
    if (enabledPaymentMethods.length > 0) {
      const currentMethodExists = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
      if (!currentMethodExists) setPaymentMethod(enabledPaymentMethods[0].method_id);
    }
  }, [enabledPaymentMethods]);

  useEffect(() => {
    if (formData.city && zonesWithRates.length > 0) {
      const cityLower = formData.city.toLowerCase();
      const matchedZone = zonesWithRates.find(zone => {
        const zoneName = zone.name.toLowerCase();
        const regions = zone.regions.map(r => r.toLowerCase());
        return zoneName.includes(cityLower) || 
               cityLower.includes(zoneName.replace(' সিটি', '').replace(' city', '')) ||
               regions.some(r => r.includes(cityLower) || cityLower.includes(r));
      });
      if (matchedZone && matchedZone.id !== selectedZoneId) {
        setSelectedZoneId(matchedZone.id);
      } else if (!matchedZone && !selectedZoneId) {
        const defaultZone = zonesWithRates.find(z => z.name.includes('সারাদেশ') || z.name.toLowerCase().includes('all')) || zonesWithRates[zonesWithRates.length - 1];
        if (defaultZone) setSelectedZoneId(defaultZone.id);
      }
    }
  }, [formData.city, zonesWithRates, selectedZoneId]);

  const { calculateDiscount: calculateAutoDiscount, getActiveRules } = useAutoDiscountRules();
  const autoDiscount = couponState?.autoDiscount || calculateAutoDiscount(subtotal);
  const activeAutoRules = getActiveRules().filter(rule => rule.rule_type === "cart_total" && rule.min_purchase && subtotal >= rule.min_purchase);
  
  const couponDiscount = appliedCoupon?.discountAmount || couponState?.discountAmount || 0;
  const discount = Math.max(couponDiscount, autoDiscount);
  const isAutoDiscountApplied = autoDiscount > couponDiscount && autoDiscount > 0;
  
  const codCharge = useMemo(() => {
    const selectedMethod = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
    if (!selectedMethod || selectedMethod.method_id !== 'cod' || !selectedMethod.cod_charge_enabled) return 0;
    if (selectedMethod.cod_charge_type === 'percentage') return Math.round((subtotal * selectedMethod.cod_charge_value) / 100);
    return selectedMethod.cod_charge_value;
  }, [enabledPaymentMethods, paymentMethod, subtotal]);
  
  const total = subtotal - discount + shippingCost + codCharge;


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city) {
      toast.error(t('checkout.fillRequired')); return false;
    }
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
      toast.error(t('checkout.validPhone')); return false;
    }
    if (formData.firstName.length > 50) { toast.error("First name must be less than 50 characters"); return false; }
    if (formData.lastName.length > 50) { toast.error("Last name must be less than 50 characters"); return false; }
    if (formData.address.length > 200) { toast.error("Address must be less than 200 characters"); return false; }
    if (formData.city.length > 50) { toast.error("City must be less than 50 characters"); return false; }
    if (formData.postalCode && formData.postalCode.length > 10) { toast.error("Postal code must be less than 10 characters"); return false; }
    if (!formData.email) { toast.error("Please provide an email address"); return false; }
    if (!selectedZoneId || !selectedRateId) { toast.error(t('checkout.selectShipping')); return false; }
    
    if (!billingAddressSameAsShipping && !useSavedBillingAddress) {
      if (!billingFormData.firstName || !billingFormData.lastName || !billingFormData.phone || !billingFormData.address || !billingFormData.city) {
        toast.error(t('checkout.fillBilling')); return false;
      }
      const phoneRegex2 = /^(\+?880|0)?1[3-9]\d{8}$/;
      if (!phoneRegex2.test(billingFormData.phone.replace(/[\s-]/g, ''))) {
        toast.error("Please enter a valid Bangladeshi phone number for billing"); return false;
      }
    }

    if (['bkash', 'nagad', 'rocket', 'upay', 'bank_transfer', 'cheque'].includes(paymentMethod) && !transactionId.trim()) {
      const labels: Record<string, string> = { bank_transfer: "Transaction Reference", cheque: "Cheque Number" };
      toast.error(`Please enter ${labels[paymentMethod] || "Transaction ID"}`);
      return false;
    }

    if (!acceptedTerms) {
      toast.error(t('checkout.acceptTerms')); return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowReviewModal(true);
  };

  const handleConfirmOrder = async () => {
    setProcessing(true);
    try {
      let customerId: string | null = null;

      if (user) {
        const { data: existingCustomer } = await supabase.from('customers').select('id').eq('user_id', user.id).single();
        if (existingCustomer) {
          customerId = existingCustomer.id;
          await supabase.from('customers').update({
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: JSON.stringify({ street: formData.address, city: formData.city, postal_code: formData.postalCode || null }),
          } as any).eq('id', customerId);
        } else {
          const { data: newCustomer, error: customerError } = await supabase.from('customers' as any).insert([{
            user_id: user.id, email: formData.email,
            full_name: `${formData.firstName} ${formData.lastName}`, phone: formData.phone,
            address: JSON.stringify({ street: formData.address, city: formData.city, postal_code: formData.postalCode || null }),
          }] as any).select('id').single();
          if (customerError) throw customerError;
          customerId = (newCustomer as any)?.id || null;
        }
      }

      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const couponCodeUsed = appliedCoupon?.coupon.code || couponState?.couponCode || null;
      const orderNotes = ['bkash', 'nagad', 'rocket'].includes(paymentMethod) && transactionId
        ? `${formData.notes ? formData.notes + ' | ' : ''}${paymentMethod.toUpperCase()} TrxID: ${transactionId}`
        : formData.notes || null;

      const notesArray = [orderNotes, couponCodeUsed ? `Coupon: ${couponCodeUsed}` : null, isGift ? `Gift Order${giftMessage ? `: ${giftMessage}` : ''}` : null].filter(Boolean);

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_id: customerId, user_id: user?.id || null, order_number: orderNumber,
        subtotal, shipping_cost: shippingCost, discount_amount: discount, total_amount: total,
        status: 'pending', payment_method: paymentMethod, payment_status: 'pending',
        is_gift: isGift,
        shipping_address: {
          name: `${formData.firstName} ${formData.lastName}`, phone: formData.phone, email: formData.email,
          street: formData.address, city: formData.city, postal_code: formData.postalCode || null,
        },
        notes: notesArray.length > 0 ? notesArray.join(' | ') : null,
      }).select('id, order_number').single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id, product_id: item.id,
        product_name: item.name + (item.size ? ` (${item.size})` : '') + (item.color ? ` - ${item.color}` : ''),
        quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Deduct product stock for each ordered item
      for (const item of items) {
        // Check if this is a variant (has size/color info indicating variant)
        if (item.size || item.color) {
          // Try to find and update variant stock
          const variantName = item.size || item.color || '';
          const { data: variantData } = await supabase
            .from('product_variants')
            .select('id, quantity')
            .eq('product_id', item.id)
            .ilike('name', `%${variantName}%`)
            .maybeSingle();
          
          if (variantData) {
            await supabase
              .from('product_variants')
              .update({ quantity: Math.max(0, (variantData.quantity || 0) - item.quantity) })
              .eq('id', variantData.id);
          }
        }
        
        // Always deduct from main product stock
        const { data: productData } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.id)
          .single();
        
        if (productData) {
          await supabase
            .from('products')
            .update({ quantity: Math.max(0, productData.quantity - item.quantity) })
            .eq('id', item.id);
        }
      }

      if (customerId) {
        const { data: customerStats } = await supabase.from('customers').select('total_orders, total_spent').eq('id', customerId).single();
        if (customerStats) {
          await supabase.from('customers').update({
            total_orders: (customerStats.total_orders || 0) + 1, total_spent: (customerStats.total_spent || 0) + total,
          }).eq('id', customerId);
        }
      }

      if (appliedCoupon?.coupon.id || couponState?.couponId) {
        const couponId = appliedCoupon?.coupon.id || couponState?.couponId;
        if (couponId) await incrementCouponUsage(couponId);
      }

      try {
        const paymentMethodNames: Record<string, string> = {
          cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", upay: "Upay",
          bank_transfer: "Bank Transfer", paypal: "PayPal", payoneer: "Payoneer", sslcommerz: "SSLCommerz", aamarpay: "aamarPay",
        };
        await supabase.functions.invoke("send-order-confirmation", {
          body: {
            customerEmail: formData.email, customerName: `${formData.firstName} ${formData.lastName}`,
            orderNumber: order.order_number,
            items: items.map(item => ({ name: item.name + (item.size ? ` (${item.size})` : "") + (item.color ? ` - ${item.color}` : ""), quantity: item.quantity, price: item.price * item.quantity })),
            subtotal, shippingCost, total,
            shippingAddress: `${formData.address}, ${formData.city}${formData.postalCode ? `, ${formData.postalCode}` : ""}`,
            paymentMethod: paymentMethodNames[paymentMethod] || paymentMethod,
          },
        });
      } catch (emailError) { console.error("Failed to send confirmation email:", emailError); }

      toast.success(t('checkout.orderPlaced'));

      if (user && saveShippingAddress && !useSavedShippingAddress) {
        try {
          await supabase.from('user_addresses').insert({
            user_id: user.id, label: shippingAddressLabel, full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone, street_address: formData.address, city: formData.city, postal_code: formData.postalCode || null, is_default: false,
          });
          toast.success(`Shipping address saved as "${shippingAddressLabel}"`);
        } catch (e) { console.error("Failed to save address:", e); }
      }
      
      if (user && saveBillingAddress && !billingAddressSameAsShipping && !useSavedBillingAddress) {
        try {
          await supabase.from('user_addresses').insert({
            user_id: user.id, label: billingAddressLabel, full_name: `${billingFormData.firstName} ${billingFormData.lastName}`,
            phone: billingFormData.phone, street_address: billingFormData.address, city: billingFormData.city, postal_code: billingFormData.postalCode || null, is_default: false,
          });
          toast.success(`Billing address saved as "${billingAddressLabel}"`);
        } catch (e) { console.error("Failed to save billing address:", e); }
      }
      
      await markCartRecovered(order.id);
      // Only remove checked-out items, not the entire cart
      if (selectedItems.length > 0 && selectedItems.length < allItems.length) {
        removeSelectedItems();
      } else {
        clearCart();
      }
      
      const selectedPaymentMethod = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
      
      const orderConfirmationState = { 
        orderNumber: order.order_number,
        paymentMethod: selectedPaymentMethod ? {
          method_id: selectedPaymentMethod.method_id, name: selectedPaymentMethod.name, name_bn: selectedPaymentMethod.name_bn,
          icon: selectedPaymentMethod.icon, logo_url: selectedPaymentMethod.logo_url,
          account_number: selectedPaymentMethod.account_number, account_type: selectedPaymentMethod.account_type,
        } : null,
        transactionId: transactionId || null, total,
        items: items.map(item => ({
          name: item.name + (item.size ? ` (${item.size})` : '') + (item.color ? ` - ${item.color}` : ''),
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        subtotal,
        discount,
        shippingCost,
        codCharge,
        deliveryEstimate: selectedRate ? `${selectedRate.min_days ?? 1}-${selectedRate.max_days ?? 3} business days` : '3-5 business days',
        shippingZone: selectedZone?.name || '',
      };

      // Check if this is a gateway or bKash API mode — use real payment flow
      const isBkashApi = selectedPaymentMethod?.method_id === 'bkash' && selectedPaymentMethod?.payment_mode === 'api';
      const isGatewayMethod = selectedPaymentMethod?.type === 'gateway';
      
      if (isGatewayMethod || isBkashApi) {
        try {
          // Store order confirmation state in sessionStorage for callback
          sessionStorage.setItem('gateway_order_state', JSON.stringify(orderConfirmationState));
          
          const baseUrl = window.location.origin;
          const gatewayId = selectedPaymentMethod?.method_id || paymentMethod;
          
          const { data: gwData, error: gwError } = await supabase.functions.invoke('payment-gateway-init', {
            body: {
              gateway: gatewayId,
              orderId: order.id,
              orderNumber: order.order_number,
              totalAmount: total,
              customerName: `${formData.firstName} ${formData.lastName}`,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              customerAddress: formData.address,
              customerCity: formData.city,
              customerPostCode: formData.postalCode || '1000',
              productNames: items.map(i => i.name).join(', ').slice(0, 250),
              successUrl: `${baseUrl}/payment-callback?status=success`,
              failUrl: `${baseUrl}/payment-callback?status=fail`,
              cancelUrl: `${baseUrl}/payment-callback?status=cancel`,
            },
          });

          if (gwError) throw gwError;
          if (!gwData?.success || !gwData?.gatewayUrl) {
            throw new Error(gwData?.error || `Failed to initialize ${selectedPaymentMethod?.name || gatewayId} payment`);
          }

          // Redirect to payment gateway page
          window.location.href = gwData.gatewayUrl;
          return; // Don't navigate further
        } catch (gwErr: any) {
          console.error('Payment gateway init failed:', gwErr);
          toast.error(`Payment gateway error: ${gwErr.message || 'Could not connect to payment gateway'}`);
          setProcessing(false);
          setShowReviewModal(false);
          return;
        }
      }
      
      // Manual/COD methods: go directly to order confirmation
      navigate("/order-confirmation", { state: orderConfirmationState });
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
      setShowReviewModal(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-3">{t('checkout.emptyCart')}</h1>
          <p className="text-muted-foreground mb-8">{t('checkout.addProductsFirst')}</p>
          <Button asChild><Link to="/products">{t('checkout.shopNow')}</Link></Button>
        </div>
      </>
    );
  }

  const selectedPaymentMethodObj = enabledPaymentMethods.find(m => m.method_id === paymentMethod);

  return (
    <>
      <SEOHead title={t('checkout.title')} description={t('checkout.title')} noIndex={true} />
      {/* Page Header */}
      <section className="relative bg-gradient-to-r from-store-primary to-store-secondary py-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-store-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-store-primary-foreground" asChild>
              <Link to="/cart"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="font-display text-2xl font-bold text-store-primary-foreground">{t('checkout.title')}</h1>
          </div>
        </div>
      </section>

      {/* Checkout Steps */}
      <div className="container mx-auto px-4">
        <CheckoutSteps currentStep={currentStep} />
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              <CheckoutContactSection
                email={formData.email}
                onEmailChange={(email) => setFormData(prev => ({ ...prev, email }))}
                isLoggedIn={!!user}
                createAccount={createAccount}
                onCreateAccountChange={setCreateAccount}
              />

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-store-primary" /> {t('checkout.shippingInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user && (
                    <>
                      <SavedAddressSelector
                        userId={user.id} type="shipping"
                        onSelectAddress={(address) => {
                          if (address) {
                            setSelectedSavedAddress({ id: address.id, label: address.label, full_name: address.full_name, phone: address.phone, street_address: address.street_address, area: address.area, city: address.city, postal_code: address.postal_code, is_default: address.is_default });
                            setUseSavedShippingAddress(true);
                            const nameParts = address.full_name.split(" ");
                            setFormData(prev => ({ ...prev, firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "", phone: address.phone, address: address.street_address + (address.area ? `, ${address.area}` : ""), city: address.city, postalCode: address.postal_code || "" }));
                          } else { setSelectedSavedAddress(null); }
                        }}
                        onUseNewAddress={() => { setUseSavedShippingAddress(false); setSelectedSavedAddress(null); setFormData(prev => ({ ...prev, firstName: "", lastName: "", phone: "", address: "", city: "", postalCode: "" })); }}
                      />
                      <Separator />
                    </>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t('checkout.firstName')} *</Label>
                      <Input id="firstName" name="firstName" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value.slice(0, 50) }))} maxLength={50} required />
                      <p className="text-xs text-muted-foreground mt-1">{formData.firstName.length}/50</p>
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t('checkout.lastName')} *</Label>
                      <Input id="lastName" name="lastName" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value.slice(0, 50) }))} maxLength={50} required />
                      <p className="text-xs text-muted-foreground mt-1">{formData.lastName.length}/50</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('checkout.phoneNumber')} *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={(e) => { const value = e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 15); setFormData(prev => ({ ...prev, phone: value })); }} placeholder="+880 1XXX-XXXXXX" maxLength={15} required />
                    <p className="text-xs text-muted-foreground mt-1">{t('checkout.phoneFormat')}</p>
                  </div>
                  <div>
                    <Label htmlFor="address">{t('checkout.address')} *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value.slice(0, 200) }))} placeholder={t('checkout.houseFlatNo')} maxLength={200} required />
                    <p className="text-xs text-muted-foreground mt-1">{formData.address.length}/200</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">{t('checkout.city')} *</Label>
                      <Input id="city" name="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value.slice(0, 50) }))} maxLength={50} required />
                      <p className="text-xs text-muted-foreground mt-1">{formData.city.length}/50</p>
                    </div>
                    <div>
                      <Label htmlFor="postalCode">{t('checkout.postalCode')}</Label>
                      <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={(e) => { const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setFormData(prev => ({ ...prev, postalCode: value })); }} maxLength={10} placeholder="1205" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">{t('checkout.orderNotes')}</Label>
                    <Input id="notes" name="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value.slice(0, 500) }))} placeholder={t('checkout.specialInstructions')} maxLength={500} />
                    <p className="text-xs text-muted-foreground mt-1">{formData.notes.length}/500</p>
                  </div>

                  {/* Shipping Zone & Rate Selection */}
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-store-primary" /> {t('checkout.shippingZoneRate')}
                    </div>
                    {shippingLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('checkout.loadingShipping')}</div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="shippingZone">{t('checkout.shippingZone')} *</Label>
                          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                            <SelectTrigger><SelectValue placeholder={t('checkout.selectArea')} /></SelectTrigger>
                            <SelectContent>
                              {zonesWithRates.filter(z => z.is_active).map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>{zone.name} ({zone.regions.join(', ')})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedZone && availableRates.length > 0 && (
                          <div>
                            <Label>{t('checkout.deliveryOption')} *</Label>
                            <RadioGroup value={selectedRateId} onValueChange={setSelectedRateId} className="mt-2">
                              {availableRates.map((rate) => {
                                const isFree = rate.max_order_amount && subtotal >= rate.max_order_amount;
                                const displayPrice = isFree ? 0 : rate.rate;
                                return (
                                  <label key={rate.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-store-primary transition-colors">
                                    <div className="flex items-center gap-3">
                                      <RadioGroupItem value={rate.id} />
                                      <div>
                                        <p className="font-medium text-sm">{rate.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" /> {rate.min_days ?? 1}-{rate.max_days ?? 3} {t('checkout.days')}
                                          {rate.min_weight && rate.max_weight ? ` • ${rate.min_weight}-${rate.max_weight}kg` : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {isFree ? <span className="text-green-600 font-medium text-sm">{t('checkout.free')}</span> : <span className="font-medium text-sm">{formatPrice(displayPrice)}</span>}
                                      {rate.max_order_amount && !isFree && <p className="text-xs text-muted-foreground">{formatPrice(rate.max_order_amount)}+ {t('checkout.free').toLowerCase()}</p>}
                                    </div>
                                  </label>
                                );
                              })}
                            </RadioGroup>
                          </div>
                        )}
                        {selectedZone && availableRates.length === 0 && <p className="text-sm text-muted-foreground">{t('checkout.noShippingOptions')}</p>}
                      </>
                    )}
                  </div>

                  {user && !useSavedShippingAddress && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox id="saveShippingAddress" checked={saveShippingAddress} onCheckedChange={(checked) => setSaveShippingAddress(checked as boolean)} />
                          <Label htmlFor="saveShippingAddress" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                            <Save className="h-4 w-4 text-store-primary" /> {t('checkout.saveAddress')}
                          </Label>
                        </div>
                        {saveShippingAddress && (
                          <div className="ml-6">
                            <Label htmlFor="addressLabel" className="text-xs text-muted-foreground">{t('checkout.addressLabel')}</Label>
                            <Select value={shippingAddressLabel} onValueChange={setShippingAddressLabel}>
                              <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Home">{t('checkout.home')}</SelectItem>
                                <SelectItem value="Office">{t('checkout.office')}</SelectItem>
                                <SelectItem value="Other">{t('checkout.other')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-store-primary" /> {t('checkout.billingAddress')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="billingAddressSameAsShipping" checked={billingAddressSameAsShipping} onCheckedChange={(checked) => setBillingAddressSameAsShipping(checked as boolean)} />
                    <Label htmlFor="billingAddressSameAsShipping" className="text-sm font-normal cursor-pointer">{t('checkout.sameAsShipping')}</Label>
                  </div>
                  {!billingAddressSameAsShipping && user && (
                    <>
                      <Separator />
                      <SavedAddressSelector userId={user.id} type="billing"
                        onSelectAddress={(address) => {
                          if (address) {
                            setSelectedBillingAddress({ id: address.id, label: address.label, full_name: address.full_name, phone: address.phone, street_address: address.street_address, area: address.area, city: address.city, postal_code: address.postal_code, is_default: address.is_default });
                            setUseSavedBillingAddress(true); setHasBillingAddresses(true);
                            const nameParts = address.full_name.split(' ');
                            setBillingFormData({ firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(' ') || "", phone: address.phone, address: address.street_address, city: address.city, postalCode: address.postal_code || "" });
                          } else { setSelectedBillingAddress(null); }
                        }}
                        onUseNewAddress={() => { setUseSavedBillingAddress(false); setSelectedBillingAddress(null); setBillingFormData({ firstName: "", lastName: "", phone: "", address: "", city: "", postalCode: "" }); }}
                      />
                      {!useSavedBillingAddress && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="billingFirstName">{t('checkout.firstName')} *</Label>
                                <Input id="billingFirstName" value={billingFormData.firstName} onChange={(e) => setBillingFormData(prev => ({ ...prev, firstName: e.target.value.slice(0, 50) }))} maxLength={50} required={!billingAddressSameAsShipping} />
                              </div>
                              <div>
                                <Label htmlFor="billingLastName">{t('checkout.lastName')} *</Label>
                                <Input id="billingLastName" value={billingFormData.lastName} onChange={(e) => setBillingFormData(prev => ({ ...prev, lastName: e.target.value.slice(0, 50) }))} maxLength={50} required={!billingAddressSameAsShipping} />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="billingPhone">{t('checkout.phoneNumber')} *</Label>
                              <Input id="billingPhone" type="tel" value={billingFormData.phone} onChange={(e) => { const value = e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 15); setBillingFormData(prev => ({ ...prev, phone: value })); }} placeholder="+880 1XXX-XXXXXX" maxLength={15} required={!billingAddressSameAsShipping} />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress">{t('checkout.address')} *</Label>
                              <Input id="billingAddress" value={billingFormData.address} onChange={(e) => setBillingFormData(prev => ({ ...prev, address: e.target.value.slice(0, 200) }))} placeholder={t('checkout.houseFlatNo')} maxLength={200} required={!billingAddressSameAsShipping} />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="billingCity">{t('checkout.city')} *</Label>
                                <Input id="billingCity" value={billingFormData.city} onChange={(e) => setBillingFormData(prev => ({ ...prev, city: e.target.value.slice(0, 50) }))} maxLength={50} required={!billingAddressSameAsShipping} />
                              </div>
                              <div>
                                <Label htmlFor="billingPostalCode">{t('checkout.postalCode')}</Label>
                                <Input id="billingPostalCode" value={billingFormData.postalCode} onChange={(e) => { const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setBillingFormData(prev => ({ ...prev, postalCode: value })); }} maxLength={10} placeholder="1205" />
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Checkbox id="saveBillingAddress" checked={saveBillingAddress} onCheckedChange={(checked) => setSaveBillingAddress(checked as boolean)} />
                                <Label htmlFor="saveBillingAddress" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                                  <Save className="h-4 w-4 text-store-primary" /> {t('checkout.saveBillingAddr')}
                                </Label>
                              </div>
                              {saveBillingAddress && (
                                <div className="ml-6">
                                  <Label htmlFor="billingAddressLabel" className="text-xs text-muted-foreground">Address Label</Label>
                                  <Select value={billingAddressLabel} onValueChange={setBillingAddressLabel}>
                                    <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Home">{t('checkout.home')}</SelectItem>
                                      <SelectItem value="Office">{t('checkout.office')}</SelectItem>
                                      <SelectItem value="Other">{t('checkout.other')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {!billingAddressSameAsShipping && !user && (
                    <p className="text-sm text-muted-foreground">
                      <Link to="/login" className="text-store-primary hover:underline">{t('nav.logout') === 'লগআউট' ? 'লগ ইন' : 'Log in'}</Link> {t('checkout.loginForSavedAddr')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-store-primary" /> {t('checkout.paymentMethod')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentMethodsLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : enabledPaymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('checkout.noPaymentMethods')}</p>
                  ) : (
                    <>
                      <RadioGroup value={paymentMethod} onValueChange={(value) => { setPaymentMethod(value); setTransactionId(""); }}>
                        <div className="space-y-3">
                          {enabledPaymentMethods.map((method) => {
                            let methodCodCharge = 0;
                            if (method.method_id === 'cod' && method.cod_charge_enabled) {
                              methodCodCharge = method.cod_charge_type === 'percentage' ? Math.round((subtotal * method.cod_charge_value) / 100) : method.cod_charge_value;
                            }
                            return (
                              <label key={method.id} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-store-primary transition-colors">
                                <RadioGroupItem value={method.method_id} id={method.method_id} />
                                <div className="flex-1 flex items-center gap-3">
                                  {method.logo_url ? (
                                    <img src={method.logo_url} alt={method.name} className="h-10 w-10 object-contain rounded" />
                                  ) : method.icon ? (
                                    <span className="text-2xl">{method.icon}</span>
                                  ) : method.type === 'manual' ? (
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium">
                                        {method.name}
                                        {method.name_bn && <span className="text-muted-foreground ml-1">({method.name_bn})</span>}
                                      </p>
                                      {methodCodCharge > 0 && (
                                        <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">+{formatPrice(methodCodCharge)}</span>
                                      )}
                                    </div>
                                    {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </RadioGroup>
                      
                      {(() => {
                        const selectedMethod = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
                        if (!selectedMethod) return null;

                        // Manual mobile payments (bKash, Nagad, Rocket, Upay)
                        if (selectedMethod.type === 'mobile' || ['bkash', 'nagad', 'rocket', 'upay'].includes(selectedMethod.method_id)) {
                          return <ManualPaymentInstructions paymentMethod={selectedMethod} transactionId={transactionId} onTransactionIdChange={setTransactionId} />;
                        }

                        // Bank transfer
                        if (selectedMethod.method_id === 'bank_transfer') {
                          return <BankTransferInstructions paymentMethod={selectedMethod} transactionId={transactionId} onTransactionIdChange={setTransactionId} />;
                        }

                        // COD with charge
                        if (selectedMethod.method_id === 'cod') {
                          return (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                              <div className="flex items-start gap-2">
                                <Truck className="h-5 w-5 text-store-primary shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">{t('checkout.cashOnDelivery')}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {t('checkout.codDescription')}
                                  </p>
                                  {selectedMethod.cod_charge_enabled && codCharge > 0 && (
                                    <div className="mt-2 p-2 bg-warning/10 rounded border border-warning/20">
                                      <p className="text-sm text-warning flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {t('checkout.additionalCodCharge')} {formatPrice(codCharge)}
                                        {selectedMethod.cod_charge_type === 'percentage' && ` (${selectedMethod.cod_charge_value}%)`}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Cheque payment
                        if (selectedMethod.method_id === 'cheque') {
                          return (
                            <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg border">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-store-primary" />
                                <div>
                                  <p className="font-semibold">{t('checkout.chequePayment')}</p>
                                  <p className="text-xs text-muted-foreground">{t('checkout.chequeCleared')}</p>
                                </div>
                              </div>
                              <div className="text-sm bg-background p-3 rounded-lg border space-y-2">
                                <p className="font-medium">{t('checkout.instructions')}</p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                  <li>Write the cheque for the exact order amount: <strong className="text-foreground">{formatPrice(total)}</strong></li>
                                  <li>Make it payable to: <strong className="text-foreground">{selectedMethod.payable_to || 'Our Store'}</strong></li>
                                  <li>Mail or drop off the cheque at our office</li>
                                  <li>Order ships after cheque clearance (3-5 business days)</li>
                                </ol>
                              </div>
                              <div>
                                <Label htmlFor="transactionId" className="text-sm font-medium">{t('checkout.chequeNumber')} *</Label>
                                <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value.toUpperCase())} placeholder="e.g. CHQ-123456" className="mt-1 font-mono" required />
                              </div>
                            </div>
                          );
                        }

                        // All gateway / auto payment methods (SSLCommerz, Stripe, PayPal, aamarPay, ShurjoPay, 2Checkout, Payoneer)
                        if (selectedMethod.type === 'gateway') {
                          return (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{t('checkout.payWith')} {selectedMethod.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {t('checkout.redirectToGateway')} {selectedMethod.name} {t('checkout.toCompletePayment')}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>{t('checkout.paymentSecure')}</span>
                              </div>
                            </div>
                          );
                        }

                        // Fallback for custom methods
                        return (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground">{selectedMethod.description || 'Follow the instructions to complete payment.'}</p>
                            {selectedMethod.instructions && (
                              <p className="text-sm mt-2">{selectedMethod.instructions}</p>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Gift Options */}
              <GiftOptions
                isGift={isGift} onIsGiftChange={setIsGift}
                giftMessage={giftMessage} onGiftMessageChange={setGiftMessage}
                hidePricing={hidePricing} onHidePricingChange={setHidePricing}
              />

              {/* Terms & Conditions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Checkbox id="acceptTerms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} className="mt-0.5" />
                    <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer leading-relaxed">
                      {t('checkout.termsAgree')}{' '}
                      <Link to="/terms" className="text-store-primary hover:underline" target="_blank">{t('checkout.termsAndConditions')}</Link>
                      {' '}{t('checkout.and')}{' '}
                      <Link to="/privacy" className="text-store-primary hover:underline" target="_blank">{t('checkout.privacyPolicy')}</Link>
                      {' '}*
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <CheckoutOrderSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
              shippingCost={shippingCost}
              codCharge={codCharge}
              total={total}
              isAutoDiscountApplied={isAutoDiscountApplied}
              couponCode={couponCode}
              onCouponCodeChange={setCouponCode}
              appliedCouponCode={appliedCoupon?.coupon.code || (location.state as any)?.couponCode}
              onApplyCoupon={() => validateCoupon(couponCode, subtotal)}
              onRemoveCoupon={removeCoupon}
              couponLoading={couponLoading}
              processing={processing}
              selectedZoneId={selectedZoneId}
              selectedRateId={selectedRateId}
              acceptedTerms={acceptedTerms}
              selectedZoneName={selectedZone?.name}
              selectedRateName={selectedRate?.name}
              selectedRateMaxOrderAmount={selectedRate?.max_order_amount}
              
            />
          </div>
        </form>
      </div>

      {/* Order Review Modal */}
      <OrderReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        items={items}
        subtotal={subtotal}
        discount={discount}
        shippingCost={shippingCost}
        codCharge={codCharge}
        total={total}
        paymentMethodName={selectedPaymentMethodObj?.name || paymentMethod}
        shippingAddress={`${formData.firstName} ${formData.lastName}, ${formData.address}, ${formData.city}${formData.postalCode ? `, ${formData.postalCode}` : ''}`}
        onConfirm={handleConfirmOrder}
        processing={processing}
      />
    </>
  );
}
