/**
 * Translates an internal order status to a display label using i18n.
 * Stored enum values remain unchanged — this is purely for UI display.
 */
export const getTranslatedStatus = (status, t) => {
    const key = (status || 'processing').toLowerCase();
    const map = {
        'processing': t('statuses.processing'),
        'confirmed': t('statuses.confirmed'),
        'shipped': t('statuses.shipped'),
        'delivered': t('statuses.delivered'),
        'cancelled': t('statuses.cancelled'),
        'pending': t('statuses.processing'),
    };
    return map[key] || status || t('statuses.processing');
};

/**
 * Translates an internal payment status to a display label using i18n.
 */
export const getTranslatedPaymentStatus = (status, t) => {
    const key = (status || 'unpaid').toLowerCase();
    const map = {
        'unpaid': t('statuses.unpaid'),
        'paid': t('statuses.paid'),
        'pending_verification': t('statuses.pendingVerification'),
        'pending verification': t('statuses.pendingVerification'),
        'failed': t('statuses.failed'),
    };
    return map[key] || status || t('statuses.unpaid');
};
